"use client"

import type React from "react"

import { ArrowLeft, User, Bell, Shield, Palette, Globe, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { IconRail } from "@/components/figma/icon-rail"

const settingsNavigation = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Privacy", href: "/settings/privacy", icon: Shield },
  { name: "Account", href: "/settings/account", icon: User },
  { name: "Wallpaper", href: "/settings/wallpaper", icon: Palette },
  { name: "Language", href: "/settings/language", icon: Globe },
  { name: "Help", href: "/settings/help", icon: HelpCircle },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="h-screen bg-neutral-900">
      <div className="h-full w-full bg-white shadow-sm">
        <div className="flex h-full">
          {/* Left Icon Rail */}
          <IconRail activeTab="settings" />

          {/* Settings Sidebar */}
          <aside className="w-[360px] shrink-0 border-r border-neutral-200 bg-white">
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => router.push("/chat")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {settingsNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-emerald-600 text-white" : "text-neutral-700 hover:bg-emerald-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Divider */}
          <div className="w-px bg-neutral-200" />

          {/* Settings Content */}
          <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
        </div>
      </div>
    </div>
  )
}
