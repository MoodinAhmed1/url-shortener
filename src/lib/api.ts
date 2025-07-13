// Replace with your actual Worker URL
const WORKER_URL = "https://orange-resonance-5710.your-username.workers.dev";

// Function to create a new short URL
export async function shortenUrl(url: string, customCode: string | null = null) {
  try {
    const response = await fetch(`${WORKER_URL}/api/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, customCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to shorten URL");
    }

    return await response.json() as { shortUrl: string; shortId: string };
  } catch (error) {
    console.error("Error shortening URL:", error);
    throw error;
  }
}

// Function to get analytics for a URL
export async function getAnalytics(shortId: string) {
  try {
    const response = await fetch(`${WORKER_URL}/api/analytics/${shortId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get analytics");
    }

    return await response.json() as {
      created: string;
      clicks: number;
      countries: Record<string, number>;
      devices: Record<string, number>;
      referrers: Record<string, number>;
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    throw error;
  }
}