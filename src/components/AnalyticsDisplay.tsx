"use client"

import { useEffect, useState } from "react"
import { getAnalytics, resetAnalytics, getDebugInfo } from "../lib/api"
import Link from "next/link"
import AnalyticsCharts from "./AnalyticsCharts"

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

interface AnalyticsDisplayProps {
  shortId: string
}

export default function AnalyticsDisplay({ shortId }: AnalyticsDisplayProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getAnalytics(shortId)
        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError(err instanceof Error ? err.message : "Failed to load analytics data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [shortId])

  const handleResetAnalytics = async () => {
    if (!confirm("Are you sure you want to reset analytics? This cannot be undone.")) {
      return
    }

    try {
      await resetAnalytics(shortId)
      // Refresh analytics data
      const data = await getAnalytics(shortId)
      setAnalytics(data)
      alert("Analytics reset successfully!")
    } catch (err) {
      console.error("Error resetting analytics:", err)
      alert(err instanceof Error ? err.message : "Failed to reset analytics")
    }
  }

  const handleGetDebugInfo = async () => {
    try {
      const data = await getDebugInfo()
      setDebugInfo(data)
      setShowDebug(true)
    } catch (err) {
      console.error("Error getting debug info:", err)
      alert(err instanceof Error ? err.message : "Failed to get debug info")
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <p className="text-red-600">{error || "Failed to load analytics data"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* HEADER WITH ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive analytics for your short URL</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGetDebugInfo}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            Debug Info
          </button>
          <button
            onClick={handleResetAnalytics}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            Reset Analytics
          </button>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* ANALYTICS CHARTS COMPONENT */}
      <AnalyticsCharts analytics={analytics} shortId={shortId} />

      {/* CLICK HISTORY TABLE (Existing) */}
      {analytics.clickHistory && analytics.clickHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Recent Click History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.clickHistory
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((click, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(click.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{click.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{click.device}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{click.referrer}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEBUG INFO (Existing) */}
      {showDebug && debugInfo && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Debug Information</h3>
          <pre className="text-sm overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          <button
            onClick={() => setShowDebug(false)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Hide Debug Info
          </button>
        </div>
      )}
    </div>
  )
}
