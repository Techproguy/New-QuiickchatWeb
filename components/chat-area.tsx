"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, ArrowLeft, Loader2 } from "lucide-react"
import { chatService, type Message, type Chat } from "@/lib/chat-service"
import { format } from "date-fns"

interface ChatAreaProps {
  selectedChat: string | null
}

export function ChatArea({ selectedChat }: ChatAreaProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<Chat | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedChat) {
      loadChatInfo()
      loadMessages()
      // Refresh messages periodically
      const interval = setInterval(loadMessages, 5000) // Every 5 seconds
      return () => clearInterval(interval)
    } else {
      setMessages([])
      setChatInfo(null)
    }
  }, [selectedChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatInfo = async () => {
    if (!selectedChat) return
    try {
      const chats = await chatService.getChats()
      const chat = chats.find((c) => c.id === selectedChat)
      if (chat) {
        setChatInfo(chat)
      }
    } catch (error) {
      console.error("Failed to load chat info:", error)
    }
  }

  const loadMessages = async () => {
    if (!selectedChat) return
    try {
      setLoading(true)
      const fetchedMessages = await chatService.getMessages(selectedChat)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return

    const messageContent = message.trim()
    setMessage("")

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId: selectedChat,
      senderId: "",
      senderName: "You",
      content: messageContent,
      timestamp: new Date().toISOString(),
      status: "sending",
      isOwn: true,
      type: "text",
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      setSending(true)
      const sentMessage = await chatService.sendMessage(selectedChat, messageContent, "text")
      // Replace temp message with real one
      setMessages((prev) => prev.map((msg) => (msg.id === tempMessage.id ? sentMessage : msg)))
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      setMessage(messageContent) // Restore message text
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChat) return

    try {
      setSending(true)
      const sentMessage = await chatService.sendMediaMessage(
        selectedChat,
        file,
        file.type.startsWith("image/") ? "image" : "file"
      )
      setMessages((prev) => [...prev, sentMessage])
    } catch (error) {
      console.error("Failed to send file:", error)
    } finally {
      setSending(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return format(date, "h:mm a")
    } catch {
      return timestamp
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!selectedChat) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-black mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-600">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="md:hidden text-black hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={chatInfo?.avatar || "/placeholder-user.jpg"} alt={chatInfo?.name || "Chat"} />
              <AvatarFallback className="bg-gray-200 text-black">
                {chatInfo?.name
                  ? chatInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-black">{chatInfo?.name || "Chat"}</h2>
              <p className={`text-sm ${chatInfo?.isOnline ? "text-green-600" : "text-gray-500"}`}>
                {chatInfo?.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="text-black hover:bg-gray-100">
              <Phone className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-black hover:bg-gray-100">
              <Video className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-black hover:bg-gray-100">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const mediaUrl = msg.mediaUrl ?? (msg.type === "image" || msg.type === "video" ? msg.content : undefined)
            const displayContent = msg.content || (msg.type === "image" || msg.type === "video" ? "" : "[Media]")
            return (
              <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isOwn ? "bg-emerald-600 text-white" : "bg-white text-neutral-900 border border-gray-200"
                  }`}
                >
                  {msg.type === "image" && mediaUrl ? (
                    <img src={mediaUrl} alt="Shared image" className="max-w-full rounded" />
                  ) : msg.type === "video" && mediaUrl ? (
                    <video src={mediaUrl} controls className="max-w-full rounded" />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
                  )}
                  <p className={`text-xs mt-1 ${msg.isOwn ? "text-emerald-100" : "text-gray-500"}`}>
                    {formatTimestamp(msg.timestamp)}
                    {msg.isOwn && (
                      <span className="ml-2">
                        {msg.status === "sending" && "⏳"}
                        {msg.status === "sent" && "✓"}
                        {msg.status === "delivered" && "✓✓"}
                        {msg.status === "read" && "✓✓"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <label htmlFor="file-upload">
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-500 hover:text-black hover:bg-gray-100 cursor-pointer"
              disabled={sending}
              asChild
            >
              <span>
                <Paperclip className="w-5 h-5" />
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={sending}
          />

          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-12 bg-gray-50 border-gray-200 text-black"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black hover:bg-gray-100"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
