"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { wsClient } from "@/lib/websocket"
import { chatService, type Chat, type Message, type TypingIndicator } from "@/lib/chat-service"
import { zengoService } from "@/lib/zengo-service"
import { API_CONFIG } from "@/lib/api-config"

interface ChatContextType {
  chats: Chat[]
  selectedChat: Chat | null
  messages: Message[]
  typingUsers: Map<string, TypingIndicator>
  onlineUsers: Set<string>
  isLoading: boolean
  isConnected: boolean
  selectChat: (chat: Chat | null) => void
  sendMessage: (content: string, type?: "text" | "image" | "file") => Promise<void>
  loadChats: () => Promise<void>
  loadMessages: (chatId: string) => Promise<void>
  markAsRead: (chatId: string) => void
  startTyping: () => void
  stopTyping: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTimeRef = useRef<number>(0)

  const loadChats = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const fetchedChats = await chatService.getChats()
      setChats(fetchedChats)
    } catch (error: any) {
      if (!silent) {
        console.error("Failed to load chats:", error)
        setChats([])
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    // Only access localStorage on client side after mount
    if (typeof window === 'undefined' || !mounted) return
    
    const token = localStorage.getItem("authToken")
    if (token) {
      // WebSocket will check connection status internally before connecting
      wsClient.connect(token)
      setIsConnected(true)
    } else {
      setIsConnected(false)
    }

    // Set up WebSocket event listeners
    const handleMessageReceived = (data: any) => {
      const chatId = data.chatId ?? data.chat_id
      const mediaUrl = data.media_url ?? data.mediaUrl
      const msgType = (data.type ?? data.message_type ?? "text") as Message["type"]
      const message: Message = {
        id: data.id ?? data.message_id,
        chatId,
        senderId: data.senderId ?? data.sender_id,
        senderName: data.senderName ?? data.sender_name ?? "",
        content: data.content ?? (mediaUrl ? "[Media]" : ""),
        mediaUrl,
        timestamp: data.timestamp ?? data.created_at ?? new Date().toISOString(),
        status: "delivered",
        isOwn: false,
        type: msgType,
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })

      setChats((prev) => {
        const exists = prev.some((c) => c.id === chatId)
        if (!exists) {
          loadChats(true)
          return prev
        }
        return prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: message.content,
                lastMessageTime: message.timestamp,
                unreadCount: chat.id === selectedChat?.id ? 0 : chat.unreadCount + 1,
              }
            : chat
        )
      })
    }

    const handleMessageSent = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.tempId || msg.id === data.id
            ? { ...msg, id: data.id, status: "sent" }
            : msg
        )
      )
    }

    const handleMessageDelivered = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, status: "delivered" } : msg))
      )
    }

    const handleMessageRead = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, status: "read" } : msg))
      )
    }

    const handleUserOnline = (data: any) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]))
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId || chat.participants?.includes(data.userId)
            ? { ...chat, isOnline: true }
            : chat
        )
      )
    }

    const handleUserOffline = (data: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(data.userId)
        return next
      })
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId || chat.participants?.includes(data.userId)
            ? { ...chat, isOnline: false }
            : chat
        )
      )
    }

    const handleTypingStart = (data: unknown) => {
      const d = data as TypingIndicator
      if (d?.chatId === selectedChat?.id && !d.isOwn) {
        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.set(d.userId, d)
          return next
        })
      }
    }

    const handleTypingStop = (data: unknown) => {
      const d = data as TypingIndicator
      if (d?.userId != null) {
        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.delete(d.userId)
          return next
        })
      }
    }

    const handleConnectionStatus = (data: unknown) => {
      setIsConnected(data === true)
    }

    const handleConnectionError = (data: unknown) => {
      const err = data as { message?: string; readyState?: number }
      const msg = err?.message || "Connection failed. Check that the backend is running and WebSocket URL is correct (use /status-updates, not /ws)."
      console.warn("WebSocket:", msg)
      setIsConnected(false)
    }

    const handleConnectionClose = (data: unknown) => {
      console.log("WebSocket closed:", data)
      setIsConnected(false)
    }

    // Register event listeners
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.MESSAGE_RECEIVED, handleMessageReceived)
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.MESSAGE_SENT, handleMessageSent)
    wsClient.on("message:delivered", handleMessageDelivered)
    wsClient.on("message:read", handleMessageRead)
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.USER_ONLINE, handleUserOnline)
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.USER_OFFLINE, handleUserOffline)
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.TYPING_START, handleTypingStart)
    wsClient.on(API_CONFIG.WEBSOCKET.EVENTS.TYPING_STOP, handleTypingStop)
    wsClient.on("connection:status", handleConnectionStatus)
    wsClient.on("connection:error", handleConnectionError)
    wsClient.on("connection:close", handleConnectionClose)

    // Cleanup
    return () => {
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.MESSAGE_RECEIVED, handleMessageReceived)
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.MESSAGE_SENT, handleMessageSent)
      wsClient.off("message:delivered", handleMessageDelivered)
      wsClient.off("message:read", handleMessageRead)
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.USER_ONLINE, handleUserOnline)
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.USER_OFFLINE, handleUserOffline)
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.TYPING_START, handleTypingStart)
      wsClient.off(API_CONFIG.WEBSOCKET.EVENTS.TYPING_STOP, handleTypingStop)
      wsClient.off("connection:status", handleConnectionStatus)
      wsClient.off("connection:error", handleConnectionError)
      wsClient.off("connection:close", handleConnectionClose)
      wsClient.disconnect()
    }
  }, [mounted, selectedChat?.id, loadChats])

  // Zengo (Zego IM) online status polling - complements WebSocket presence
  useEffect(() => {
    if (!mounted || !chats.length) return
    const participantIds = Array.from(
      new Set(chats.flatMap((c) => c.participants ?? []).filter(Boolean))
    ) as string[]
    if (!participantIds.length) return
    const interval = setInterval(async () => {
      try {
        const statuses = await zengoService.getOnlineStatus(participantIds)
        setOnlineUsers((prev) => {
          const next = new Set(prev)
          statuses.forEach((s) => {
            if (s.online) next.add(s.userId)
            else next.delete(s.userId)
          })
          return next
        })
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            isOnline: (chat.participants ?? []).some((id) =>
              statuses.find((s) => s.userId === id && s.online)
            ),
          }))
        )
      } catch {
        // Zengo/Zego IM may be unavailable - silently ignore
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [mounted, chats])

  // Load chats on mount - only when authenticated
  useEffect(() => {
    if (!mounted) return
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (token) {
      loadChats()
    } else {
      setIsLoading(false)
      setChats([])
    }
  }, [mounted])

  // Poll chat list so new chats/messages appear without refresh (fallback when WebSocket misses)
  useEffect(() => {
    if (!mounted || !localStorage.getItem("authToken")) return
    const interval = setInterval(() => loadChats(true), 5000)
    return () => clearInterval(interval)
  }, [mounted, loadChats])

  // Keep selected chat in sync with chat list (e.g. after Zego user names are loaded)
  useEffect(() => {
    if (!selectedChat || !chats.length) return
    const updated = chats.find((c) => c.id === selectedChat.id)
    if (updated && (updated.name !== selectedChat.name || updated.avatar !== selectedChat.avatar)) {
      setSelectedChat(updated)
    }
  }, [chats, selectedChat?.id])

  const loadMessages = useCallback(async (chatId: string, otherParticipantIds?: string[]) => {
    try {
      setIsLoading(true)
      const fetchedMessages = await chatService.getMessages(chatId, 1, 50, otherParticipantIds)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectChat = useCallback(
    async (chat: Chat | null) => {
      setSelectedChat(chat)
      if (chat) {
        await loadMessages(chat.id, chat.participants)
        markAsRead(chat.id)
      } else {
        setMessages([])
      }
    },
    [loadMessages]
  )

  const markAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat))
    )

    // Send read receipt via WebSocket
    wsClient.send("message:read", { chatId })
  }, [])

  const stopTyping = useCallback(() => {
    if (!selectedChat) return

    if (wsClient.isConnected) {
      wsClient.send(API_CONFIG.WEBSOCKET.EVENTS.TYPING_STOP, {
        chatId: selectedChat.id,
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [selectedChat])

  const sendMessage = useCallback(
    async (content: string, type: "text" | "image" | "file" = "text") => {
      if (!selectedChat || !content.trim()) return

      const tempId = `temp_${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        chatId: selectedChat.id,
        senderId: "",
        senderName: "",
        content,
        timestamp: new Date().toISOString(),
        status: "sending",
        isOwn: true,
        type,
      }

      // Optimistically add message
      setMessages((prev) => [...prev, tempMessage])

      try {
        const receiverId = selectedChat.participants?.[0] ?? undefined
        const sentMessage = await chatService.sendMessage(selectedChat.id, content, type, receiverId)
        
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...sentMessage, status: "sent" } : msg))
        )

        // Send via WebSocket
        wsClient.send(API_CONFIG.WEBSOCKET.EVENTS.MESSAGE_SENT, {
          chatId: selectedChat.id,
          content,
          type,
        })

        // Update chat list
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: content,
                  lastMessageTime: new Date().toISOString(),
                }
              : chat
          )
        )

        // Stop typing
        stopTyping()
      } catch (error) {
        console.error("Failed to send message:", error)
        // Remove failed message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      }
    },
    [selectedChat, stopTyping]
  )

  const startTyping = useCallback(() => {
    if (!selectedChat) return

    const now = Date.now()
    // Throttle typing indicators (send max once per 3 seconds)
    if (now - lastTypingTimeRef.current < 3000) return
    lastTypingTimeRef.current = now

    if (wsClient.isConnected) {
      wsClient.send(API_CONFIG.WEBSOCKET.EVENTS.TYPING_START, {
        chatId: selectedChat.id,
      })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [selectedChat, stopTyping])

  return (
    <ChatContext.Provider
      value={{
        chats,
        selectedChat,
        messages,
        typingUsers,
        onlineUsers,
        isLoading,
        isConnected,
        selectChat,
        sendMessage,
        loadChats,
        loadMessages,
        markAsRead,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

