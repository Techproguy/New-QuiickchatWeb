"use client"

import { useState, useEffect } from "react"
import { User, Bell, Shield, Palette, Globe, HelpCircle, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { userService, type UserProfile } from "@/lib/user-service"

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

export function SettingsSidebar() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile()
      .then(setProfile)
      .catch(() => {})
  }, [])

  const displayName = profile?.name?.trim() || profile?.phone || "User"
  const initials = profile?.name?.trim()
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.phone
      ? profile.phone.slice(-2)
      : "U"

  return (
    <section className="flex h-full flex-col bg-white">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
        <h2 className="text-center text-[22px] font-semibold text-emerald-600 mb-4">Settings</h2>

        {/* Profile Section */}
        <div
          className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 cursor-pointer hover:bg-neutral-100 transition-colors"
          onClick={() => router.push("/settings/profile")}
        >
          <Avatar className="h-12 w-12 cursor-pointer">
            <AvatarImage src={profile?.avatar || "/placeholder.svg?height=48&width=48"} alt={profile?.name} />
            <AvatarFallback className="text-sm bg-emerald-600 text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 truncate">{displayName}</h3>
            <p className="text-xs text-neutral-600 truncate">{profile?.about || profile?.status || "Available"}</p>
          </div>
        </div>
      </div>

      {/* Settings Options - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {settingsOptions.map((option) => (
          <div
            key={option.title}
            className="group border-b border-neutral-100 px-6 py-4 hover:bg-neutral-50 cursor-pointer"
            onClick={() => router.push(option.href)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <option.icon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{option.title}</p>
                <p className="text-xs text-neutral-600">{option.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-neutral-200 p-4">
        <button
          onClick={() => {
            localStorage.removeItem("authToken")
            router.push("/login")
          }}
          className="w-full rounded-lg border border-red-200 bg-transparent px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </section>
  )
}
