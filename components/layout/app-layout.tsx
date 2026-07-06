"use client"

import type React from "react"

import { IconRail } from "@/components/figma/icon-rail"
import { ChatList } from "@/components/figma/chat-list"

interface AppLayoutProps {
  children: React.ReactNode
  activeTab: "chats" | "calls" | "recent" | "settings"
  sidebarContent?: React.ReactNode
}

export function AppLayout({ children, activeTab, sidebarContent }: AppLayoutProps) {
  return (
    <div className="h-screen bg-neutral-900">
      {/* Full screen container - no padding */}
      <div className="h-full w-full bg-white shadow-sm">
        <div className="flex h-full">
          {/* Left icon rail (exact width) */}
          <IconRail activeTab={activeTab} />

          {/* Sidebar content (chat list or other content) */}
          <div className="w-[360px] shrink-0 border-r border-neutral-200 bg-white">
            {sidebarContent || <ChatList />}
          </div>

          {/* Divider */}
          <div className="w-px bg-neutral-200" />

          {/* Main content area */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
