"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Phone, Clock, Settings } from "lucide-react"

interface IconRailProps {
  activeTab?: "chats" | "calls" | "recent" | "settings"
}

function RailButton({
  icon: Icon,
  active = false,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  label: string
  href: string
}) {
  const content = (
    <>
      {active && <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
      <Icon className={`h-5 w-5 ${active ? "text-emerald-600" : "text-neutral-700"}`} />
    </>
  )

  if (active) {
    return (
      <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-white ring-1 ring-black/10">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="relative grid h-12 w-12 place-items-center rounded-xl transition-colors hover:bg-neutral-300/70"
      aria-label={label}
    >
      {content}
    </Link>
  )
}

export function IconRail({ activeTab = "chats" }: IconRailProps) {
  return (
    <aside className="flex w-[84px] shrink-0 flex-col items-center justify-between bg-neutral-200/70 px-4 py-6">
      <div className="flex flex-col items-center gap-4">
        <Link href="/chat" className="mb-2" aria-label="Quiickchat home">
          <Image src="/appIcon.png" alt="Quiickchat" width={40} height={40} className="rounded-xl" priority />
        </Link>
        <RailButton icon={MessageSquare} active={activeTab === "chats"} label="Chats" href="/chat" />
        <RailButton icon={Phone} active={activeTab === "calls"} label="Calls" href="/calls" />
        <RailButton icon={Clock} active={activeTab === "recent"} label="Recent" href="/recent" />
      </div>
      <div className="pb-2">
        <RailButton icon={Settings} active={activeTab === "settings"} label="Settings" href="/settings" />
      </div>
    </aside>
  )
}
