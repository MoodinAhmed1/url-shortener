// Replace with your actual Worker URL
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://young-snow-d7b9.elenibekele0.workers.dev"
console.log("Using worker URL:", WORKER_URL)

// Function to create a new short URL
export async function shortenUrl(url: string, customCode: string | null = null) {
  try {
    // Get user ID from localStorage if available
    let userId = null
    const userData = localStorage.getItem("userData")
    if (userData) {
      userId = JSON.parse(userData).id
    }

    const response = await fetch(`${WORKER_URL}/api/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, customCode, userId }),
    })
 
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to shorten URL")
    }

    return (await response.json()) as { shortUrl: string; shortId: string }
  } catch (error) {
    console.error("Error shortening URL:", error)
    throw error
  }
}

// Function to get analytics for a URL
export async function getAnalytics(shortId: string) {
  try {
    const response = await fetch(`${WORKER_URL}/api/analytics/${shortId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get analytics")
    }

    return (await response.json()) as {
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
  } catch (error) {
    console.error("Error getting analytics:", error)
    throw error
  }
}

// Function to reset analytics (for testing)
export async function resetAnalytics(shortId: string) {
  try {
    const response = await fetch(`${WORKER_URL}/api/reset-analytics/${shortId}`, {
      method: "POST",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to reset analytics")
    }

    return response.json()
  } catch (error) {
    console.error("Error resetting analytics:", error)
    throw error
  }
}

// Function to get debug info
export async function getDebugInfo() {
  try {
    const response = await fetch(`${WORKER_URL}/api/debug`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get debug info")
    }

    return response.json()
  } catch (error) {
    console.error("Error getting debug info:", error)
    throw error
  }
}

export async function getUserLinks() {
  try {
    // Get user ID from localStorage
    const userData = localStorage.getItem("userData")
    if (!userData) {
      throw new Error("User not logged in")
    }

    const userId = JSON.parse(userData).id
    console.log("Fetching links for user ID:", userId)

    const response = await fetch(`${WORKER_URL}/api/links?userId=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Error response text:", errorText)

      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { error: `HTTP ${response.status}: ${errorText}` }
      }

      throw new Error(error.error || "Failed to fetch links")
    }

    const data = await response.json()
    console.log("Successfully fetched links:", data)
    return data
  } catch (error) {
    console.error("Error in getUserLinks:", error)
    throw error
  }
}

export async function deleteLink(shortId: string) {
  // Get user ID from localStorage
  const userData = localStorage.getItem("userData")
  if (!userData) {
    throw new Error("User not logged in")
  }

  const userId = JSON.parse(userData).id

  const response = await fetch(`${WORKER_URL}/api/links/${shortId}?userId=${userId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete link" }))
    throw new Error(error.error || "Failed to delete link")
  }

  return response.json()
}

export async function registerUser(username: string, email: string, password: string) {
  console.log("Attempting to register user at:", `${WORKER_URL}/api/auth/register`)

  try {
    const response = await fetch(`${WORKER_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to register" }))
      throw new Error(errorData.error || "Failed to register")
    }

    return response.json()
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

export async function verifyEmail(token : string) {
  const res = await fetch(`${WORKER_URL}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to verify email" }))
    throw new Error(error.error || "Failed to verify email")
  }
  return res.json()
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${WORKER_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to login" }))
    throw new Error(error.error || "Failed to login")
  }

  return response.json()
}

export async function changeUsername(newUsername: string) {
  const userData = localStorage.getItem("userData")
  if (!userData) {
    throw new Error("User not logged in")
  }

  const { id: userId } = JSON.parse(userData)

  const response = await fetch(`${WORKER_URL}/api/auth/change-username`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      newUsername
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to change username" }))
    throw new Error(error.error || "Failed to change username")
  }

  return response.json()
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const userData = localStorage.getItem("userData")
  if (!userData) {
    throw new Error("User not logged in")
  }

  const { id: userId } = JSON.parse(userData)

  const response = await fetch(`${WORKER_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      oldPassword,
      newPassword
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to change password" }))
    throw new Error(error.error || "Failed to change password")
  }

  return response.json()
}

export async function changeEmail(newEmail: string) {
  const userData = localStorage.getItem("userData")
  if (!userData) {
    throw new Error("User not logged in")
  }

  const { id: userId } = JSON.parse(userData)

  const response = await fetch(`${WORKER_URL}/api/auth/change-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      newEmail
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to change email" }))
    throw new Error(error.error || "Failed to change email")
  }

  return response.json()
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${WORKER_URL}/api/auth/request-password-reset`, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: { "Content-Type": "application/json" },
  });

  return await res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${WORKER_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  return await res.json();
}