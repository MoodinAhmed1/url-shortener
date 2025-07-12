import { nanoid } from 'nanoid';

// Define types for our environment bindings
interface Env {
  URL_MAPPINGS: KVNamespace;
}

// Define types for analytics data
interface AnalyticsData {
  created: string;
  clicks: number;
  countries: Record<string, number>;
  devices: Record<string, number>;
  referrers: Record<string, number>;
}

// This is the main function that runs when someone accesses your Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests (needed for API access from different domains)
    if (request.method === "OPTIONS") {
      return handleCors();
    }
    
    // API endpoint to create a new short URL
    if (request.method === "POST" && url.pathname === "/api/shorten") {
      return await handleShortenUrl(request, env);
    }
    
    // API endpoint to get analytics for a URL
    if (request.method === "GET" && url.pathname.startsWith("/api/analytics/")) {
      const shortId = url.pathname.replace("/api/analytics/", "");
      return await handleGetAnalytics(shortId, env);
    }
    
    // Redirect short URLs to their original destination
    const shortId = url.pathname.slice(1);
    if (shortId && !url.pathname.startsWith("/api/")) {
      return await handleRedirect(shortId, request, env);
    }
    
    // Default response for the root path
    return new Response("URL Shortener API", { status: 200 });
  },
};

// Function to handle creating new short URLs
async function handleShortenUrl(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { url: string; customCode?: string };
    const { url, customCode } = body;
    
    if (!url) {
      return jsonResponse({ error: "URL is required" }, 400);
    }
    
    // If a custom code is provided, use it; otherwise generate a random one
    const shortId = customCode || generateShortCode();
    
    // Check if custom code already exists
    if (customCode) {
      const existing = await env.URL_MAPPINGS.get(`url:${customCode}`);
      if (existing) {
        return jsonResponse({ error: "Custom code already in use" }, 400);
      }
    }
    
    // Store the URL mapping
    await env.URL_MAPPINGS.put(`url:${shortId}`, url);
    
    // Initialize analytics for this URL
    await env.URL_MAPPINGS.put(`analytics:${shortId}`, JSON.stringify({
      created: new Date().toISOString(),
      clicks: 0,
      countries: {},
      devices: {},
      referrers: {}
    } as AnalyticsData));
    
    // Construct the short URL
    const parsedUrl = new URL(url);
    const shortUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/${shortId}`;
    
    return jsonResponse({ shortUrl, shortId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: "Failed to shorten URL", details: errorMessage }, 500);
  }
}

// Function to handle redirecting from short URLs to original URLs
async function handleRedirect(shortId: string, request: Request, env: Env): Promise<Response> {
  // Look up the original URL in KV
  const originalUrl = await env.URL_MAPPINGS.get(`url:${shortId}`);
  
  if (!originalUrl) {
    return new Response("Not Found", { status: 404 });
  }
  
  // Update analytics
  await updateAnalytics(shortId, request, env);
  
  // Redirect to the original URL
  return Response.redirect(originalUrl, 302);
}

// Function to get analytics for a specific URL
async function handleGetAnalytics(shortId: string, env: Env): Promise<Response> {
  const analytics = await env.URL_MAPPINGS.get(`analytics:${shortId}`);
  
  if (!analytics) {
    return jsonResponse({ error: "URL not found" }, 404);
  }
  
  return jsonResponse(JSON.parse(analytics));
}

// Function to update analytics when a URL is accessed
async function updateAnalytics(shortId: string, request: Request, env: Env): Promise<void> {
  try {
    // Get existing analytics
    const analyticsKey = `analytics:${shortId}`;
    const existingData = await env.URL_MAPPINGS.get(analyticsKey);
    const analytics: AnalyticsData = existingData ? JSON.parse(existingData) : {
      created: new Date().toISOString(),
      clicks: 0,
      countries: {},
      devices: {},
      referrers: {}
    };
    
    // Update click count
    analytics.clicks += 1;
    
    // Get country from CF request headers
    const country = request.headers.get('CF-IPCountry') || 'Unknown';
    analytics.countries[country] = (analytics.countries[country] || 0) + 1;
    
    // Get device info from user agent
    const userAgent = request.headers.get('User-Agent') || '';
    let device = 'Unknown';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';
    else if (/windows|macintosh|linux/i.test(userAgent)) device = 'Desktop';
    
    analytics.devices[device] = (analytics.devices[device] || 0) + 1;
    
    // Get referrer
    const referrer = request.headers.get('Referer') || 'Direct';
    try {
      const referrerDomain = new URL(referrer).hostname || 'Direct';
      analytics.referrers[referrerDomain] = (analytics.referrers[referrerDomain] || 0) + 1;
    } catch {
      // If referrer is not a valid URL, just use 'Direct'
      analytics.referrers['Direct'] = (analytics.referrers['Direct'] || 0) + 1;
    }
    
    // Save updated analytics
    await env.URL_MAPPINGS.put(analyticsKey, JSON.stringify(analytics));
  } catch (error) {
    // Don't fail the redirect if analytics update fails
    console.error('Error updating analytics:', error);
  }
}

// Function to generate a short code
function generateShortCode(): string {
  // Generate a code of length 6 by default
  return nanoid(6);
}

// Function to handle CORS headers
function handleCors(): Response {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Function to return JSON responses
function jsonResponse(data: Record<string, any>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}