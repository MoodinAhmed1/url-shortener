export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-6">
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
