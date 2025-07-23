"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Copy, ExternalLink, BarChart2, Trash2 } from "lucide-react"
import { getUserLinks, deleteLink } from "@/lib/api"

interface LinkItem {
  id: string
  shortId: string
  originalUrl: string
  shortUrl: string
  clicks: number
  createdAt: string
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLinks() {
      try {
        setLoading(true)

        // Get user data
        const userData = localStorage.getItem("userData")
        if (!userData) {
          setError("User data not found. Please log in again.")
          setLoading(false)
          return
        }

        const userId = JSON.parse(userData).id
        console.log("Fetching links for user:", userId)

        const data = await getUserLinks()
        console.log("API response:", data)

        if (data.links && Array.isArray(data.links)) {
          setLinks(data.links)
        } else {
          setLinks([])
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching links:", err)
        setError(err instanceof Error ? err.message : "Failed to load links")
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, []) // Only run once on mount

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert("URL copied to clipboard!")
  }

  const handleDeleteLink = async (shortId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return
    }

    try {
      await deleteLink(shortId)
      // Remove the deleted link from the state
      setLinks(links.filter((link) => link.shortId !== shortId))
    } catch (err) {
      console.error("Error deleting link:", err)
      alert(err instanceof Error ? err.message : "Failed to delete link")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Links</h1>
          <p className="mt-2 text-gray-600">Manage and track all your shortened URLs</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your links...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Links</h1>
          <p className="mt-2 text-gray-600">Manage and track all your shortened URLs</p>
        </div>
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Links</h1>
        <p className="mt-2 text-gray-600">Manage and track all your shortened URLs</p>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">You haven't created any links yet.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create your first link
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Mobile view */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200">
              {links.map((link) => (
                <div key={link.id} className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Short URL</span>
                      <button
                        onClick={() => copyToClipboard(link.shortUrl)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy URL"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-blue-600 break-all">{link.shortUrl}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Original URL</span>
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="Open original URL"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    <p className="text-sm text-gray-500 break-all">{link.originalUrl}</p>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Clicks: </span>
                      <span className="text-sm text-gray-500">{link.clicks}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Created: </span>
                      <span className="text-sm text-gray-500">{formatDate(link.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Link
                      href={`/analytics/${link.shortId}`}
                      className="text-blue-500 hover:text-blue-700"
                      title="View analytics"
                    >
                      <BarChart2 size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteLink(link.shortId)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                  >
                    Short URL
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]"
                  >
                    Original URL
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
                  >
                    Clicks
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                          title={link.shortUrl}
                        >
                          {truncateUrl(link.shortUrl, 35)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(link.shortUrl)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Copy URL"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                          title={link.originalUrl}
                        >
                          {truncateUrl(link.originalUrl, 50)}
                        </span>
                        <a
                          href={link.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Open original URL"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">{link.clicks}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(link.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-3">
                        <Link
                          href={`/analytics/${link.shortId}`}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="View analytics"
                        >
                          <BarChart2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteLink(link.shortId)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete link"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
