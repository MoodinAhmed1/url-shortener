import { nanoid } from "nanoid"
import * as bcrypt from "bcryptjs"
import type { KVNamespace } from "@cloudflare/workers-types"

// Define types for our environment bindings
interface Env {
  URL_MAPPINGS: KVNamespace
  USERS: KVNamespace
  ANALYTICS: KVNamespace // Now required, not optional
}

// Define types for analytics data
interface AnalyticsData {
  created: string
  clicks: number
  countries: Record<string, number>
  devices: Record<string, number>
  referrers: Record<string, number>
  clickHistory: Array<{
    timestamp: string
    country: string
    device: string
    referrer: string
    userAgent: string
  }>
}

// Define types for user data
interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
}

// Define types for URL data
interface UrlData {
  id: string
  shortId: string
  originalUrl: string
  shortUrl: string
  userId: string
  clicks: number
  createdAt: string
}

// This is the main function that runs when someone accesses your Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle CORS preflight requests (needed for API access from different domains)
    if (request.method === "OPTIONS") {
      return handleCors()
    }

    // Add a debug endpoint to see what headers Cloudflare provides
    if (url.pathname === "/api/debug" && request.method === "GET") {
      return jsonResponse({
        message: "Debug Info",
        timestamp: new Date().toISOString(),
        headers: {
          "CF-IPCountry": request.headers.get("CF-IPCountry"),
          "CF-IPCity": request.headers.get("CF-IPCity"),
          "CF-Ray": request.headers.get("CF-Ray"),
          "User-Agent": request.headers.get("User-Agent"),
          Referer: request.headers.get("Referer"),
          "X-Forwarded-For": request.headers.get("X-Forwarded-For"),
        },
        url: request.url,
        method: request.method,
      })
    }

    // User authentication endpoints
    if (url.pathname.startsWith("/api/auth/")) {
      // User registration endpoint
      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        return await handleRegister(request, env)
      }

      // User login endpoint
      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        return await handleLogin(request, env)
      }

      // User change username endpoint
      if (url.pathname === "/api/auth/change-username" && request.method === "POST") {
        return await handleChangeUsername(request, env)
      }

      if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
        return await handleChangePassword(request, env)
      } 

      if (url.pathname === "/api/auth/change-email" && request.method === "POST") {
        return await handleChangeEmail(request, env)
      }

      if (url.pathname === "/api/auth/request-password-reset" && request.method === "POST") {
        return await handleRequestPasswordReset(request, env)
      }
      
      if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
        return await handleResetPassword(request, env)
      }
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        return await handleVerifyEmail(request, env)
      }
    }

    // API endpoint to create a new short URL
    if (request.method === "POST" && url.pathname === "/api/shorten") {
      return await handleShortenUrl(request, env)
    }

    // API endpoint to get user's links
    if (request.method === "GET" && url.pathname === "/api/links") {
      return await handleGetUserLinks(request, env)
    }

    // API endpoint to delete a link
    if (request.method === "DELETE" && url.pathname.startsWith("/api/links/")) {
      const linkId = url.pathname.replace("/api/links/", "")
      return await handleDeleteLink(linkId, request, env)
    }

    // API endpoint to get analytics for a URL
    if (request.method === "GET" && url.pathname.startsWith("/api/analytics/")) {
      const shortId = url.pathname.replace("/api/analytics/", "")
      return await handleGetAnalytics(shortId, env)
    }

    // API endpoint to reset analytics (for testing)
    if (request.method === "POST" && url.pathname.startsWith("/api/reset-analytics/")) {
      const shortId = url.pathname.replace("/api/reset-analytics/", "")
      return await handleResetAnalytics(shortId, env)
    }


    // Redirect short URLs to their original destination
    const shortId = url.pathname.slice(1)
    if (shortId && !url.pathname.startsWith("/api/")) {
      return await handleRedirect(shortId, request, env)
    }

    // Default response for the root path
    return new Response("URL Shortener API - Updated with Analytics KV", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain",
      },
    })
  },
}

// Function to handle user registration
async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const { username, email, password } = (await request.json()) as {
      username: string
      email: string
      password: string
    }

    if (!username || !email || !password) {
      return jsonResponse({ error: "Username, email, and password are required" }, 400)
    }

    // Check if email already exists
    const existingUserByEmail = await env.USERS.get(`email:${email}`)
    if (existingUserByEmail) {
      return jsonResponse({ error: "Email already registered" }, 409)
    }

    // Check if username already exists
    const existingUserByUsername = await env.USERS.get(`username:${username}`)
    if (existingUserByUsername) {
      return jsonResponse({ error: "Username already taken" }, 409)
    }

    // Generate user ID
    const userId = nanoid(16)

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user object
    const user: User = {
      id: userId,
      email,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    // Store user data
    await env.USERS.put(userId, JSON.stringify(user))
    await env.USERS.put(`email:${email}`, userId)
    await env.USERS.put(`username:${username}`, userId)
    await env.USERS.put(`verified:${userId}`, "false") // Initially not verified

    // Send verification email
    //create token
    const token = crypto.randomUUID()
    await env.USERS.put(`verify:${token}`, userId, { expirationTtl: 86400 }) // 24 hours
    // Send verification email
    await sendEmail(email, "verification link", `Click to verify your account: http://localhost:3000/verify-register?token=${token}`)

    // Return user data (excluding password)
    const { passwordHash: _, ...userWithoutPassword } = user
    return jsonResponse({
      message: "User registered successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Error registering user:", error)
    return jsonResponse({ error: "Failed to register user" }, 500)
  }
}

async function handleVerifyEmail(request: Request, env: Env): Promise<Response> {
  const { token } = (await request.json()) as {
    token: string
  }
  const userId = await env.USERS.get(`verify:${token}`)
  if (!userId) {
    throw new Error("Invalid or expired verification token")
  }

  await env.USERS.delete(`verify:${token}`) // Invalidate the token
  await env.USERS.put(`verified:${userId}`, "true") // Mark user as verified
  console.log(`Email verified for user: ${userId}`)
  // Optionally, you can redirect the user to a success page
  return jsonResponse({ message: "Email verified successfully" })
}

  // Function to handle user login
async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const { email, password } = (await request.json()) as { email: string; password: string }

    if (!email || !password) {
      return jsonResponse({ error: "Email and password are required" }, 400)
    }

    // Get user ID by email
    const userId = await env.USERS.get(`email:${email}`)
    if (!userId) {
      return jsonResponse({ error: "Invalid email or password" }, 401)
    }

    // Get user data
    const userJson = await env.USERS.get(userId)
    if (!userJson) {
      return jsonResponse({ error: "User not found" }, 404)
    }

    const user = JSON.parse(userJson) as User

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return jsonResponse({ error: "Invalid email or password" }, 401)
    }
    const isVerified = await env.USERS.get(`verified:${userId}`)
    if (isVerified !== "true") {
      return jsonResponse({ error: "User not verified" }, 403)
    }
    
    // Return user data (excluding password)
    const { passwordHash: _, ...userWithoutPassword } = user
    return jsonResponse({
      message: "Login successful",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Error logging in:", error)
    return jsonResponse({ error: "Failed to log in" }, 500)
  }
}

async function handleChangeUsername(request: Request, env: Env): Promise<Response> {
  try {
    const { userId, newUsername } = (await request.json()) as { userId: string; newUsername: string }

    if (!userId || !newUsername) {
      return jsonResponse({ error: "User ID and new username are required" }, 400)
    }

    // Check if username already exists
    const existingUser = await env.USERS.get(`username:${newUsername}`)
    if (existingUser) {
      return jsonResponse({ error: "Username already taken" }, 409)
    }

    // Get current user data
    const userJson = await env.USERS.get(userId)
    if (!userJson) {
      return jsonResponse({ error: "User not found" }, 404)
    }

    const user = JSON.parse(userJson) as User

    // Update username in user data
    const oldUsername = user.username;
    user.username = newUsername

    // Store updated user data
    await env.USERS.put(userId, JSON.stringify(user))
    await env.USERS.put(`username:${newUsername}`, userId)
    await env.USERS.delete(`username:${oldUsername}`)

    return jsonResponse({
      message: "Username changed successfully",
      user: { ...user, passwordHash: undefined },
    })
  } catch (error) {
    console.error("Error changing username:", error)
    return jsonResponse({ error: "Failed to change username" }, 500)
  }
}

async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  try {
    const { userId, oldPassword, newPassword } = (await request.json()) as { userId: string; oldPassword: string; newPassword: string }
    if (!userId || !oldPassword || !newPassword) {
      return jsonResponse({ error: "User ID, old password, and new password are required" }, 400)
    }
    // Get user data
    const userJson = await env.USERS.get(userId)
    if (!userJson) {
      return jsonResponse({ error: "User not found" }, 404)
    }
    const user = JSON.parse(userJson) as User
    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isOldPasswordValid) {
      return jsonResponse({ error: "Invalid old password" }, 401)
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)
    // Update password in user data
    user.passwordHash = newPasswordHash
    // Store updated user data
    await env.USERS.put(userId, JSON.stringify(user))
    return jsonResponse({
      message: "Password changed successfully",
      user: { ...user, passwordHash: undefined }, // Exclude password hash from response
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return jsonResponse({ error: "Failed to change password" }, 500)
  }
}

async function handleChangeEmail(request: Request, env: Env): Promise<Response> {
  try {
    const { userId, newEmail } = (await request.json()) as { userId: string; newEmail: string }

    if (!userId || !newEmail) {
      return jsonResponse({ error: "User ID and new email are required" }, 400)
    }

    // Check if email already exists
    const existingUser = await env.USERS.get(`email:${newEmail}`)
    if (existingUser) {
      return jsonResponse({ error: "Email already registered" }, 409)
    }

    // Get current user data
    const userJson = await env.USERS.get(userId)
    if (!userJson) {
      return jsonResponse({ error: "User not found" }, 404)
    }

    const user = JSON.parse(userJson) as User

    // Update email in user data
    const oldEmail = user.email;
    user.email = newEmail

    // Store updated user data
    await env.USERS.put(userId, JSON.stringify(user))
    await env.USERS.put(`email:${newEmail}`, userId)
    await env.USERS.delete(`email:${oldEmail}`)

    return jsonResponse({
      message: "Email changed successfully",
      user: { ...user, passwordHash: undefined },
    })
  } catch (error) {
    console.error("Error changing email:", error)
    return jsonResponse({ error: "Failed to change email" }, 500)
  }
}

async function handleRequestPasswordReset(request: Request, env: Env): Promise<Response> {
  try {
    const { email } = (await request.json()) as { email: string }

    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400)
    }

    // Get user ID by email
    const userId = await env.USERS.get(`email:${email}`)
    if (!userId) {
      return jsonResponse({ error: "Email not registered" }, 404)
    }

    const token = crypto.randomUUID();
    await env.USERS.put(`reset:${token}`, email, { expirationTtl: 900 }); // 15 mins

    const link = `http://localhost:3000/email-redirect?token=${token}`;

    await sendEmail(email, "Reset your password", `Click to reset: ${link}`);

    return jsonResponse({
      message: "Password reset link sent to your email",
      userId,
    })
  }
  catch (error) {
    console.error("Error requesting password reset:", error)
    return jsonResponse({ error: "Failed to request password reset" }, 500)
  }
}

async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  const { token, newPassword } = (await request.json()) as {
    token: string
    newPassword: string
  }

  const email = await env.USERS.get(`reset:${token}`)
  if (!email) {
    return jsonResponse({ error: 'Invalid or expired token' }, 400)
  }

  const userId = await env.USERS.get(`email:${email}`)

  if (!userId) {
    return jsonResponse({ error: 'User not found' }, 404)
  }

  const userData = await env.USERS.get(`${userId}`)
  const user = JSON.parse(userData as string)

  // ✅ Hash password with bcrypt
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(newPassword, salt)
  user.passwordHash = passwordHash

  // ✅ Update user data
  await env.USERS.put(`${userId}`, JSON.stringify(user))

  // ✅ Invalidate token
  await env.USERS.delete(`reset:${token}`)

  return jsonResponse({ message: 'Password reset successful.' })
}

// Function to handle creating new short URLs
async function handleShortenUrl(request: Request, env: Env): Promise<Response> {
  try {
    const { url, customCode, userId } = (await request.json()) as {
      url: string
      customCode?: string
      userId?: string
    }

    if (!url) {
      return jsonResponse({ error: "URL is required" }, 400)
    }

    // If a custom code is provided, use it; otherwise generate a random one
    const shortId = customCode || generateShortCode()

    // Check if custom code already exists
    if (customCode) {
      const existing = await env.URL_MAPPINGS.get(`url:${customCode}`)
      if (existing) {
        return jsonResponse({ error: "Custom code already in use" }, 400)
      }
    }

    // Generate a unique ID for this URL
    const urlId = nanoid(16)

    // Store the URL mapping
    await env.URL_MAPPINGS.put(`url:${shortId}`, url)

    // Construct the short URL
    const shortUrl = `${new URL(request.url).origin}/${shortId}`

    // Create URL data object
    const urlData: UrlData = {
      id: urlId,
      shortId,
      originalUrl: url,
      shortUrl,
      userId: userId || "anonymous",
      clicks: 0,
      createdAt: new Date().toISOString(),
    }

    // Store URL data
    await env.URL_MAPPINGS.put(`urldata:${shortId}`, JSON.stringify(urlData))

    // If user is authenticated, add this URL to their list
    if (userId) {
      // Get user's URLs list
      const userUrlsKey = `user:${userId}:urls`
      const userUrlsJson = await env.URL_MAPPINGS.get(userUrlsKey)
      const userUrls: string[] = userUrlsJson ? JSON.parse(userUrlsJson) : []

      // Add new URL to the list
      userUrls.unshift(shortId)

      // Store updated list
      await env.URL_MAPPINGS.put(userUrlsKey, JSON.stringify(userUrls))
    }

    // Initialize analytics for this URL in the ANALYTICS KV namespace
    const analyticsData: AnalyticsData = {
      created: new Date().toISOString(),
      clicks: 0,
      countries: {},
      devices: {},
      referrers: {},
      clickHistory: [],
    }

    // Store in ANALYTICS KV namespace (separate from URL_MAPPINGS)
    await env.ANALYTICS.put(shortId, JSON.stringify(analyticsData))

    console.log(`Created short URL: ${shortId} -> ${url}`)
    return jsonResponse({ shortUrl, shortId })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error in handleShortenUrl:", errorMessage)
    return jsonResponse({ error: "Failed to shorten URL", details: errorMessage }, 500)
  }
}

// Function to handle getting a user's links
async function handleGetUserLinks(request: Request, env: Env): Promise<Response> {
  try {
    console.log("handleGetUserLinks called")

    // Get user ID from query parameter
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    console.log("User ID from query:", userId)

    if (!userId) {
      return jsonResponse({ error: "User ID is required" }, 400)
    }

    // Get user's URLs list
    const userUrlsKey = `user:${userId}:urls`
    console.log("Looking for key:", userUrlsKey)

    const userUrlsJson = await env.URL_MAPPINGS.get(userUrlsKey)
    console.log("User URLs JSON:", userUrlsJson)

    if (!userUrlsJson) {
      console.log("No URLs found for user")
      return jsonResponse({ links: [] })
    }

    const shortIds: string[] = JSON.parse(userUrlsJson)
    console.log("Short IDs:", shortIds)

    const links: UrlData[] = []

    // Get data for each URL
    for (const shortId of shortIds) {
      const urlDataJson = await env.URL_MAPPINGS.get(`urldata:${shortId}`)
      if (urlDataJson) {
        const urlData = JSON.parse(urlDataJson) as UrlData

        // Get analytics from ANALYTICS KV namespace
        const analyticsJson = await env.ANALYTICS.get(shortId)
        if (analyticsJson) {
          const analytics = JSON.parse(analyticsJson) as AnalyticsData
          urlData.clicks = analytics.clicks
        }

        links.push(urlData)
      }
    }

    console.log("Returning links:", links)
    return jsonResponse({ links })
  } catch (error) {
    console.error("Error getting user links:", error)
    return jsonResponse(
      { error: "Failed to get user links", details: error instanceof Error ? error.message : "Unknown error" },
      500,
    )
  }
}

// Function to handle deleting a link
async function handleDeleteLink(linkId: string, request: Request, env: Env): Promise<Response> {
  try {
    // Get URL data
    const urlDataJson = await env.URL_MAPPINGS.get(`urldata:${linkId}`)
    if (!urlDataJson) {
      return jsonResponse({ error: "Link not found" }, 404)
    }

    const urlData = JSON.parse(urlDataJson) as UrlData

    // Get user ID from query parameter
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    // Check if the user owns this link
    if (userId && urlData.userId !== userId) {
      return jsonResponse({ error: "Unauthorized" }, 403)
    }

    // Delete URL mapping
    await env.URL_MAPPINGS.delete(`url:${linkId}`)

    // Delete URL data
    await env.URL_MAPPINGS.delete(`urldata:${linkId}`)

    // Delete analytics from ANALYTICS KV namespace
    await env.ANALYTICS.delete(linkId)

    // Remove from user's URLs list
    if (userId) {
      const userUrlsKey = `user:${userId}:urls`
      const userUrlsJson = await env.URL_MAPPINGS.get(userUrlsKey)

      if (userUrlsJson) {
        let userUrls: string[] = JSON.parse(userUrlsJson)
        userUrls = userUrls.filter((id) => id !== linkId)
        await env.URL_MAPPINGS.put(userUrlsKey, JSON.stringify(userUrls))
      }
    }

    return jsonResponse({ message: "Link deleted successfully" })
  } catch (error) {
    console.error("Error deleting link:", error)
    return jsonResponse({ error: "Failed to delete link" }, 500)
  }
}

// Function to handle redirecting from short URLs to original URLs
async function handleRedirect(shortId: string, request: Request, env: Env): Promise<Response> {
  console.log(`Handling redirect for: ${shortId}`)

  // Look up the original URL in KV
  const originalUrl = await env.URL_MAPPINGS.get(`url:${shortId}`)

  if (!originalUrl) {
    console.log(`URL not found for shortId: ${shortId}`)
    return new Response("Not Found", { status: 404 })
  }

  console.log(`Found URL: ${originalUrl}`)

  // Update analytics BEFORE redirecting
  await updateAnalytics(shortId, request, env)

  // Redirect to the original URL
  return Response.redirect(originalUrl, 302)
}

// Function to get analytics for a specific URL
async function handleGetAnalytics(shortId: string, env: Env): Promise<Response> {
  console.log(`Getting analytics for: ${shortId}`)

  // Get analytics from ANALYTICS KV namespace
  const analytics = await env.ANALYTICS.get(shortId)

  if (!analytics) {
    console.log(`Analytics not found for: ${shortId}`)
    return jsonResponse({ error: "URL not found" }, 404)
  }

  const analyticsData = JSON.parse(analytics)
  console.log(`Analytics data:`, analyticsData)

  return jsonResponse(analyticsData)
}

// Function to reset analytics (for testing)
async function handleResetAnalytics(shortId: string, env: Env): Promise<Response> {
  try {
    const resetAnalytics: AnalyticsData = {
      created: new Date().toISOString(),
      clicks: 0,
      countries: {},
      devices: {},
      referrers: {},
      clickHistory: [],
    }

    await env.ANALYTICS.put(shortId, JSON.stringify(resetAnalytics))

    // Also update URL data
    const urlDataJson = await env.URL_MAPPINGS.get(`urldata:${shortId}`)
    if (urlDataJson) {
      const urlData = JSON.parse(urlDataJson) as UrlData
      urlData.clicks = 0
      await env.URL_MAPPINGS.put(`urldata:${shortId}`, JSON.stringify(urlData))
    }

    return jsonResponse({ message: "Analytics reset successfully" })
  } catch (error) {
    console.error("Error resetting analytics:", error)
    return jsonResponse({ error: "Failed to reset analytics" }, 500)
  }
}

// IMPROVED: Better analytics tracking with detailed logging and click history
async function updateAnalytics(shortId: string, request: Request, env: Env): Promise<void> {
  try {
    console.log(`=== UPDATING ANALYTICS FOR ${shortId} ===`)

    // Get existing analytics from ANALYTICS KV namespace
    const existingData = await env.ANALYTICS.get(shortId)

    const analytics: AnalyticsData = existingData
      ? JSON.parse(existingData)
      : {
          created: new Date().toISOString(),
          clicks: 0,
          countries: {},
          devices: {},
          referrers: {},
          clickHistory: [],
        }

    console.log(`Current analytics:`, analytics)

    // Update click count
    analytics.clicks += 1
    console.log(`New click count: ${analytics.clicks}`)

    // Get country from CF request headers
    const country = request.headers.get("CF-IPCountry") || "Unknown"
    analytics.countries[country] = (analytics.countries[country] || 0) + 1
    console.log(`Country: ${country}, Total for this country: ${analytics.countries[country]}`)

    // Get device info from user agent - IMPROVED detection
    const userAgent = request.headers.get("User-Agent") || ""
    let device = "Unknown"

    // Better device detection
    if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      device = "Mobile"
    } else if (/iPad/i.test(userAgent)) {
      device = "Tablet"
    } else if (/Windows|Macintosh|Linux|X11/i.test(userAgent)) {
      device = "Desktop"
    }

    analytics.devices[device] = (analytics.devices[device] || 0) + 1
    console.log(`Device: ${device}, Total for this device: ${analytics.devices[device]}`)

    // Get referrer
    const referrer = request.headers.get("Referer") || "Direct"
    let referrerDomain = "Direct"

    try {
      if (referrer !== "Direct") {
        referrerDomain = new URL(referrer).hostname || "Direct"
      }
    } catch {
      referrerDomain = "Direct"
    }

    analytics.referrers[referrerDomain] = (analytics.referrers[referrerDomain] || 0) + 1
    console.log(`Referrer: ${referrerDomain}, Total for this referrer: ${analytics.referrers[referrerDomain]}`)

    // Add to click history for detailed tracking
    analytics.clickHistory.push({
      timestamp: new Date().toISOString(),
      country,
      device,
      referrer: referrerDomain,
      userAgent: userAgent.substring(0, 200), // Truncate to avoid too much data
    })

    // Keep only last 100 clicks in history to avoid storage bloat
    if (analytics.clickHistory.length > 100) {
      analytics.clickHistory = analytics.clickHistory.slice(-100)
    }

    // Save updated analytics to ANALYTICS KV namespace
    await env.ANALYTICS.put(shortId, JSON.stringify(analytics))
    console.log(`Analytics saved to ANALYTICS KV`)

    // Update URL data with new click count
    const urlDataJson = await env.URL_MAPPINGS.get(`urldata:${shortId}`)
    if (urlDataJson) {
      const urlData = JSON.parse(urlDataJson) as UrlData
      urlData.clicks = analytics.clicks
      await env.URL_MAPPINGS.put(`urldata:${shortId}`, JSON.stringify(urlData))
      console.log(`URL data updated with new click count: ${analytics.clicks}`)
    }

    console.log(`=== ANALYTICS UPDATE COMPLETE ===`)
  } catch (error) {
    // Don't fail the redirect if analytics update fails
    console.error("Error updating analytics:", error)
  }
}

// Function to generate a short code
function generateShortCode(): string {
  // Generate a code of length 6 by default
  return nanoid(6)
}

// Function to handle CORS headers
function handleCors(): Response {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}

// Function to return JSON responses
function jsonResponse(data: Record<string, any>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

async function sendEmail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer re_ZBFKt6MF_FfL1Ws9Z6RepUu6T28HoUYgp", // replace this
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to send email:", error);
  } else {
    console.log("Email sent successfully!");
  }
}

