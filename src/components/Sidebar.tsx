"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LinkIcon, Plus, LogOut, User } from "lucide-react"

interface SidebarProps {
  closeSidebar?: () => void
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userData")
    router.push("/")
    closeSidebar?.()
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: <Plus size={18} />,
      label: "Create URL",
    },
    {
      href: "/dashboard/links",
      icon: <LinkIcon size={18} />,
      label: "Links",
    },
    {
      href: "/dashboard/profile",
      icon: <User size={18} />,
      label: "Profile",
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900"
          onClick={closeSidebar}
        >
          URL Shortener
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition cursor-pointer ${
              pathname === item.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={closeSidebar}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
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
