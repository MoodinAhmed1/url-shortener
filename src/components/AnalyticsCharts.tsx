"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

// Define colors for our charts
const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
]

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

interface AnalyticsChartsProps {
  analytics: AnalyticsData
  shortId: string
}

export default function AnalyticsCharts({ analytics, shortId }: AnalyticsChartsProps) {
  // 📈 PROCESS DATA FOR LINE CHART (Clicks over time)
  const timeSeriesData = useMemo(() => {
    if (!analytics.clickHistory || analytics.clickHistory.length === 0) {
      return []
    }

    // Group clicks by date
    const clicksByDate: Record<string, number> = {}

    analytics.clickHistory.forEach((click) => {
      const date = new Date(click.timestamp).toLocaleDateString()
      clicksByDate[date] = (clicksByDate[date] || 0) + 1
    })

    // Convert to array format for chart
    return Object.entries(clicksByDate)
      .map(([date, clicks]) => ({
        date,
        clicks,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Last 7 days
  }, [analytics.clickHistory])

  // 🥧 PROCESS DATA FOR PIE CHARTS
  const countriesData = useMemo(() => {
    return Object.entries(analytics.countries)
      .map(([country, count]) => ({
        name: country,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 countries
  }, [analytics.countries])

  const devicesData = useMemo(() => {
    return Object.entries(analytics.devices)
      .map(([device, count]) => ({
        name: device,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [analytics.devices])

  const referrersData = useMemo(() => {
    return Object.entries(analytics.referrers)
      .map(([referrer, count]) => ({
        name: referrer === "Direct" ? "Direct" : referrer,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 referrers
  }, [analytics.referrers])

  // 📊 CUSTOM TOOLTIP COMPONENTS
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Clicks:</span> {data.value}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Percentage:</span> {((data.value / analytics.clicks) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* 📊 TOP METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.clicks}</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Country</p>
              <p className="text-xl font-bold text-gray-900">
                {countriesData.length > 0 ? countriesData[0].name : "N/A"}
              </p>
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Device</p>
              <p className="text-xl font-bold text-gray-900">{devicesData.length > 0 ? devicesData[0].name : "N/A"}</p>
            </div>
            <div className="text-yellow-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Short ID</p>
              <p className="text-xl font-bold text-gray-900">{shortId}</p>
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 TRAFFIC STATISTICS - LINE CHART */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Traffic Statistics</h3>
        <p className="text-sm text-gray-500 mb-6">The chart below shows historical click count.</p>

        {timeSeriesData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No click history available yet</p>
          </div>
        )}
      </div>

      {/* 🥧 TRAFFIC SOURCES - PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REFERRERS PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Top 5 Referrers</h3>
          <p className="text-sm text-gray-500 mb-6">The chart below shows historical click sources.</p>

          {referrersData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={referrersData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {referrersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: any) => <span style={{ color: "#374151" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>No referrer data available</p>
            </div>
          )}
        </div>

        {/* DEVICES PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Device Categories</h3>
          <p className="text-sm text-gray-500 mb-6">The chart below shows device distribution.</p>

          {devicesData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devicesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {devicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: any) => <span style={{ color: "#374151" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>No device data available</p>
            </div>
          )}
        </div>
      </div>

      {/* 🌍 TRAFFIC LOCATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COUNTRIES PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Top 5 Countries</h3>
          <p className="text-sm text-gray-500 mb-6">The chart below shows historical click location.</p>

          {countriesData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={countriesData} cx="50%" cy="50%" outerRadius={120} paddingAngle={2} dataKey="value">
                    {countriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: any) => <span style={{ color: "#374151" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>No country data available</p>
            </div>
          )}
        </div>

        {/* COUNTRIES BAR CHART (Alternative view) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Countries Bar Chart</h3>
          <p className="text-sm text-gray-500 mb-6">Alternative view of country data.</p>

          {countriesData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countriesData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>No country data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
