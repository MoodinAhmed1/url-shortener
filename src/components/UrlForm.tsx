"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { shortenUrl } from "../lib/api"
import QRCode from "./QRCode"
import { Copy, QrCode } from "lucide-react"
import { Rethink_Sans } from "next/font/google"

export default function UrlForm() {
  const [url, setUrl] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!url) return

    try {
      setLoading(true)
      setError(null)

      // Get user data for debugging
      const userData = localStorage.getItem("userData")
      const userId = userData ? JSON.parse(userData).id : null

      if (!userId) {
        setDebugInfo("Warning: No user ID found. Link will be created anonymously.")
      } else {
        setDebugInfo(`User ID: ${userId}`)
      }
 
      console.log("Creating short URL for user:", userId)
      console.log("URL to shorten:", url)
      console.log("Custom code:", customCode || "none")

      const result = await shortenUrl(url, customCode || null)
      console.log("API response:", result)

      setShortUrl(result.shortUrl)
      setShowQR(true)
      setDebugInfo((prev) => `${prev}\nShort URL created: ${result.shortUrl}\nShort ID: ${result.shortId}`)

      // Force a reload of the links page after creating a new link
      if (userId) {
        localStorage.setItem("refreshLinks", "true")
      }
    } catch (error) {
      console.error("Error creating short URL:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      setDebugInfo((prev) => `${prev}\nError: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl)
    alert("Copied to clipboard!")
  }

  const toggleQRCode = () => {
    setShowQR(!showQR)
  }

  // Add debug info at the bottom
  const renderDebugInfo = () => {
    if (!debugInfo) return null

    return (
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs font-mono whitespace-pre-wrap">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        {debugInfo}
      </div>
    )
  }


  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Enter a long URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
            Custom code (optional)
          </label>
          <input
            type="text"
            id="customCode"
            value={customCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomCode(e.target.value)}
            placeholder="e.g., my-link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Short URL"}
        </button>
      </form>

      {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {shortUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium truncate">{shortUrl}</span>
            <div className="flex space-x-2">
              <button onClick={toggleQRCode} className="text-blue-500 hover:text-blue-700" title="Toggle QR Code">
                <QrCode size={18} />
              </button>
              <button onClick={copyToClipboard} className="text-blue-500 hover:text-blue-700" title="Copy to clipboard">
                <Copy size={18} />
              </button>
            </div>
          </div>

          {showQR && (
            <div className="mt-4">
              <QRCode value={shortUrl} />
            </div>
          )}

          <div className="mt-4">
            <a href={`/analytics/${shortUrl.split("/").pop()}`} className="text-sm text-blue-500 hover:text-blue-700">
              View Analytics
            </a>
          </div>
        </div>
      )}

      {renderDebugInfo()}
    </div>
  )
}
