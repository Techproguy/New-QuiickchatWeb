"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Phone, Clock, Settings, Plus, MoreVertical, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { chatService, type Chat } from "@/lib/chat-service"
import { formatDistanceToNow } from "date-fns"

interface ChatSidebarProps {
  selectedChat: string | null
  onSelectChat: (chatId: string) => void
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadChats()
    // Refresh chats periodically
    const interval = setInterval(loadChats, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadChats = async () => {
    try {
      setLoading(true)
      const fetchedChats = await chatService.getChats()
      setChats(fetchedChats)
    } catch (error) {
      console.error("Failed to load chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = useCallback((timestamp?: string) => {
    if (!timestamp) return ""
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return timestamp
    }
  }, [])

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [chats, searchQuery])

  const handleChatClick = useCallback((chatId: string) => {
    onSelectChat(chatId)
  }, [onSelectChat])

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-black">Chats</h1>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-black hover:bg-gray-100">
              <Plus className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-black hover:bg-gray-100">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 text-black"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <Button
          variant="ghost"
          className="flex-1 rounded-none border-b-2 border-black text-black"
          onClick={() => router.push("/chat")}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chats
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none text-gray-600 hover:text-black hover:bg-gray-50"
          onClick={() => router.push("/calls")}
        >
          <Phone className="w-4 h-4 mr-2" />
          Calls
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none text-gray-600 hover:text-black hover:bg-gray-50"
          onClick={() => router.push("/recent")}
        >
          <Clock className="w-4 h-4 mr-2" />
          Recent
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none text-gray-600 hover:text-black hover:bg-gray-50"
          onClick={() => router.push("/settings")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No chats found</p>
            <p className="text-sm text-gray-500 mt-2">Start a new conversation to get started</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
              selectedChat === chat.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
            }`}
            style={{ transition: "background-color 0.05s ease-out" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                  <AvatarFallback className="bg-gray-200 text-black">
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-black truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500">{formatTimestamp(chat.lastMessageTime)}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage || "No messages yet"}</p>
              </div>

              {chat.unreadCount > 0 && <Badge className="bg-blue-500 text-white text-xs">{chat.unreadCount}</Badge>}
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  )
}
