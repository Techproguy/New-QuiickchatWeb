"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { Settings } from "lucide-react"
import { Bell, User, Shield, Palette, Globe, HelpCircle } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Quiickchat</h1>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  const settingsOptions = [
    { icon: User, title: "Profile", description: "Manage your profile information", href: "/settings/profile" },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure notification preferences",
      href: "/settings/notifications",
    },
    { icon: Shield, title: "Privacy", description: "Privacy and security settings", href: "/settings/privacy" },
    { icon: Palette, title: "Wallpaper", description: "Customize your chat wallpaper", href: "/settings/wallpaper" },
    { icon: Globe, title: "Language", description: "Change app language", href: "/settings/language" },
    { icon: HelpCircle, title: "Help", description: "Get help and support", href: "/settings/help" },
  ]

  return (
    <AppLayout activeTab="settings" sidebarContent={<SettingsSidebar />}>
      <div className="flex h-full items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200">
            <Settings className="h-12 w-12 text-neutral-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-neutral-900">Settings</h3>
          <p className="text-neutral-600">Select a setting to configure your preferences</p>
        </div>
      </div>
    </AppLayout>
  )
}
