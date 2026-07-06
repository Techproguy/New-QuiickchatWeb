"use client"

import { useState, useEffect } from "react"
import { Search, Users, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from "@/contexts/chat-context"

export function ChatList() {
  const { chats, selectedChat, selectChat, isLoading, onlineUsers } = useChat()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return ""
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        return `${hours}:${minutes}`
      } else if (diffInHours < 168) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return days[date.getDay()]
      } else {
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        return `${day}/${month}`
      }
    } catch {
      return ""
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <section className="flex h-full w-[360px] shrink-0 flex-col bg-white">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
        <h2 className="text-center text-[22px] font-semibold text-emerald-600 mb-4">Chats</h2>

        {/* Search pill */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            aria-label="Search"
            placeholder="Search here"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-10 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-neutral-500">
            <p>Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-neutral-500 mb-2">
              {searchQuery ? "No chats found" : "No chats yet. Start a new conversation!"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-neutral-400 mt-2">
                If you expected to see chats, check your connection and ensure the backend is running.
              </p>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChat?.id === chat.id
            const isOnline = onlineUsers.has(chat.id) || chat.isOnline

            return (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`group border-b border-neutral-100 px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                  isSelected ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar or group preview */}
                  {chat.isGroup ? (
                    <div className="relative h-10 w-10">
                      <div className="absolute -left-1 top-0 h-6 w-6 rounded-full border-2 border-white bg-emerald-600 grid place-items-center">
                        <Users className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="absolute left-3 top-3 flex">
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-neutral-300" />
                        <div className="-ml-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-neutral-400" />
                        <div className="-ml-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-neutral-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                        <AvatarFallback className="text-[10px] bg-neutral-200 text-neutral-700">
                          {getInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[15px] font-medium text-neutral-900">{chat.name}</p>
                      <span className="ml-2 shrink-0 text-xs text-neutral-400">
                        {formatLastMessageTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate text-xs text-neutral-500">
                        {!chat.isGroup && chat.lastMessage && (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="truncate">
                          {(() => {
                            const msg = chat.lastMessage
                            if (typeof msg === "string") return msg || (chat.isGroup ? "" : "No messages yet")
                            if (msg && typeof msg === "object" && "content" in msg) return (msg as any).content || "[Media]"
                            return chat.isGroup ? "" : "No messages yet"
                          })()}
                        </span>
                      </div>
                      {chat.unreadCount > 0 ? (
                        <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-semibold text-white">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
