"use client"

import UrlForm from "@/components/UrlForm"

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Short URL</h1>
        <p className="mt-2 text-gray-600">Shorten your links and track their performance</p>
      </div>
      <UrlForm />
    </div>
  )
}
