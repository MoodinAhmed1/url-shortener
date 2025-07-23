"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LinkIcon, Plus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userData")

    // Redirect to home page
    router.push("/")
  }

  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          URL Shortener
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            pathname === "/dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Plus size={18} />
          <span>Create URL</span>
        </Link>

        <Link
          href="/dashboard/links"
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            pathname === "/dashboard/links" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <LinkIcon size={18} />
          <span>Links</span>
        </Link>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 w-full text-left rounded-md text-gray-700 hover:bg-gray-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
