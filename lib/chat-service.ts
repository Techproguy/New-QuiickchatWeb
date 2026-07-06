// Chat service for API interactions
import { apiClient, API_CONFIG } from "./api-config"
import { zengoService } from "./zengo-service"

export interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isOnline: boolean
  isGroup: boolean
  participants?: string[]
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  mediaUrl?: string
  timestamp: string
  status: "sending" | "sent" | "delivered" | "read"
  isOwn: boolean
  translated?: boolean
  translatedContent?: string
  type?: "text" | "image" | "file" | "audio" | "video"
}

export interface TypingIndicator {
  chatId: string
  userId: string
  userName: string
  isTyping: boolean
  /** When true, do not show in UI (e.g. own typing echoed by server). */
  isOwn?: boolean
}

export class ChatService {
  // Prefer display name over phone; true if value looks like a phone number
  private looksLikePhone(s: string): boolean {
    if (!s || typeof s !== "string") return false
    const t = s.trim()
    return /^\+?\d[\d\s-]*\d$/.test(t) || /^\d+$/.test(t)
  }

  // Get all chats (maps backend shape to Chat; backend uses participant_id, last_message, etc.)
  async getChats(): Promise<Chat[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CHATS_LIST)
      // Backend returns { success, message, data: chats } - extract chats array
      const raw = response?.data ?? response
      const chats: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
      const mapped = chats.map((c: any) => {
        const lm = c.last_message
        const lastMessage = typeof lm === 'string' ? lm : (lm?.content ?? (lm ? '[Media]' : ''))
        const lastMessageTime = lm?.timestamp ?? c.last_message_timestamp
        const participantId = c.participant_id
        const participants = participantId ? [participantId] : (c.participant_ids ?? [])
        const nameFromBackend =
          c.participant_username ?? c.participant_display_name ?? c.participant_name ??
          c.username ?? c.display_name ?? c.name ?? c.contact_name ??
          (participantId ? `User ${participantId}` : "Chat")
        return {
          id: c.id ?? c.chat_id,
          name: nameFromBackend,
          avatar: c.participant_avatar ?? c.avatar,
          lastMessage,
          lastMessageTime,
          unreadCount: c.unread_count ?? 0,
          isOnline: c.is_online ?? false,
          isGroup: c.is_group ?? false,
          participants,
        }
      })
      const participantIds = [...new Set(mapped.flatMap((ch) => ch.participants ?? []))].filter(Boolean) as string[]
      if (participantIds.length === 0) return mapped
      let userInfos: { userId: string; userName?: string; userAvatar?: string }[] = []
      try {
        userInfos = await zengoService.getUserInfo(participantIds)
      } catch {
        // Zengo unavailable: use backend names only
      }
      const nameByUserId = new Map<string, string>()
      const avatarByUserId = new Map<string, string>()
      userInfos.forEach((u) => {
        if (u.userName?.trim()) nameByUserId.set(u.userId, u.userName.trim())
        if (u.userAvatar) avatarByUserId.set(u.userId, u.userAvatar)
      })
      return mapped.map((ch) => {
        const otherId = ch.participants?.[0]
        const zengoName = otherId ? nameByUserId.get(otherId) : undefined
        const zengoAvatar = otherId ? avatarByUserId.get(otherId) : undefined
        const updates: Partial<Chat> = {}
        if (zengoName) updates.name = zengoName
        if (zengoAvatar) updates.avatar = zengoAvatar
        return Object.keys(updates).length ? { ...ch, ...updates } : ch
      })
    } catch (error: any) {
      // Handle 404 as route not implemented (silently return empty array)
      if (error.isNotFound || error.statusCode === 404 || error.message?.includes("not found") || error.message?.includes("404")) {
        // Route doesn't exist on backend yet - silently return empty array
        // Don't log 404 errors to reduce console noise
        return []
      }
      
      // Only log if backend was previously available and it's not a 404
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to fetch chats:", error)
        if (error.message) {
          console.error("Error details:", error.message)
        }
      }
      // Return empty array when backend is unavailable or route not found
      return []
    }
  }

  // Get messages for a chat (backend uses limit/offset, sender_id, message_type, etc.)
  // otherParticipantIds: in 1:1 chat, the other person's id(s). If sender is in this list, message is received (left). Otherwise sent (right).
  async getMessages(chatId: string, page = 1, limit = 50, otherParticipantIds?: string[]): Promise<Message[]> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.CHAT_MESSAGES.replace(":id", chatId)
      const offset = (page - 1) * limit
      const response = await apiClient.get(`${endpoint}?limit=${limit}&offset=${offset}`)
      // Backend returns { success, message, data: messages } - extract messages array
      const raw = response?.data ?? response
      const messages =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.data) ? raw.data :
        Array.isArray(raw?.messages) ? raw.messages : []
      const participants = (otherParticipantIds ?? []).map((id) => String(id).trim()).filter(Boolean)
      const currentUserIds = this.getCurrentUserIdentifiers()
      const senderId = (msg: any) => String(msg.sender_id ?? msg.senderId ?? "").trim()
      // If we have participants: sender in participants = received (left), else = sent (right)
      // Fallback: sender matches current user = sent (right)
      const isOwnMessage = (msg: any) => {
        const sid = senderId(msg)
        if (participants.length) return !participants.some((p) => p === sid)
        return currentUserIds.some((id) => String(id).trim() === sid)
      }
      const normalizeType = (t: string) => {
        const s = String(t || "").toLowerCase()
        if (["image", "photo"].includes(s)) return "image"
        if (s === "video") return "video"
        if (["audio", "voice", "voice_note"].includes(s)) return "audio"
        if (s === "file" || s === "document") return "file"
        return s || "text"
      }
      return messages.map((msg: any) => {
        const msgType = normalizeType(msg.message_type ?? msg.type) || "text"
        const hasMedia = !!(msg.media_url ?? msg.mediaUrl)
        // Content: support content, text, body, message (various API shapes); media fallback
        const textContent =
          (msg.content ?? msg.text ?? msg.body ?? msg.message ?? "") ||
          (hasMedia ? "[Media]" : "")
        return {
          id: msg.id ?? msg.message_id,
          chatId: msg.chat_id ?? chatId,
          senderId: msg.sender_id ?? msg.senderId,
          senderName: msg.sender_name ?? msg.senderName ?? "",
          content: textContent,
          mediaUrl: msg.media_url ?? msg.mediaUrl,
          timestamp: msg.timestamp ?? msg.created_at,
          status: msg.status || "sent",
          isOwn: isOwnMessage(msg),
          translated: msg.translated,
          translatedContent: msg.translated_content ?? msg.translatedContent,
          type: msgType,
        }
      })
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      return []
    }
  }

  // Send a message (backend requires receiver_id; pass other participant from chat)
  async sendMessage(
    chatId: string,
    content: string,
    type: "text" | "image" | "file" = "text",
    receiverId?: string
  ): Promise<Message> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSAGE_SEND.replace(":id", chatId)
      const messageType = type === "text" ? "text" : type === "image" ? "image" : type === "file" ? "file" : "text"
      const body: Record<string, string> = { content, message_type: messageType }
      if (receiverId) body.receiver_id = receiverId
      const response = await apiClient.post(endpoint, body)
      const d = response.data || response
      return {
        id: d.id ?? d.message_id,
        chatId: d.chat_id ?? chatId,
        senderId: d.sender_id ?? this.getCurrentUserId(),
        senderName: "",
        content: d.content ?? content,
        mediaUrl: d.media_url ?? d.mediaUrl,
        timestamp: d.timestamp ?? d.created_at ?? new Date().toISOString(),
        status: "sending",
        isOwn: true,
        type: d.message_type ?? type,
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      throw error
    }
  }

  // Create a new chat (backend expects participant_id)
  async createChat(userId: string, _isGroup = false, _name?: string): Promise<Chat> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CHAT_CREATE, {
        participant_id: userId,
      })
      const d = response.data || response
      return {
        id: d.id ?? d.chat_id,
        name: d.name ?? `User ${userId}`,
        avatar: d.avatar,
        lastMessage: d.last_message,
        lastMessageTime: d.last_message_timestamp,
        unreadCount: d.unread_count ?? 0,
        isOnline: false,
        isGroup: false,
        participants: d.participant_ids ?? [userId],
      }
    } catch (error) {
      console.error("Failed to create chat:", error)
      throw error
    }
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<void> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.CHAT_DELETE.replace(":id", chatId)
      await apiClient.delete(endpoint)
    } catch (error) {
      console.error("Failed to delete chat:", error)
      throw error
    }
  }

  // Translate a message (backend uses body/query target_language, returns translated_content)
  async translateMessage(messageId: string, targetLanguage: string): Promise<string> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSAGE_TRANSLATE.replace(":id", messageId)
      const q = `target_language=${encodeURIComponent(targetLanguage)}`
      const response = await apiClient.post(`${endpoint}?${q}`, { target_language: targetLanguage })
      const d = response.data || response
      return d.translated_content ?? d.translatedText ?? ""
    } catch (error) {
      console.error("Failed to translate message:", error)
      throw error
    }
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE)
      return response.data || response
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      throw error
    }
  }

  // Upload chat media
  // POST https://team-quiickchatbackend.onrender.com/api/v1/chat/upload
  // Body: formdata with 'file' field
  // Authorization: Bearer Token
  // Response: No response body (as per API docs)
  async uploadChatMedia(file: File): Promise<{ url: string; fileId: string }> {
    try {
      // Check if backend is available
      const { connectionStatus } = await import("./connection-status")
      if (!connectionStatus.isAvailable()) {
        throw new Error("BACKEND_UNAVAILABLE")
      }

      const formData = new FormData()
      formData.append("file", file)

      const token = apiClient.getToken()
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
      // Don't set Content-Type - browser will set it automatically with boundary for FormData

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout for file uploads

      // Full URL: https://team-quiickchatbackend.onrender.com/api/v1/chat/upload
      const fullUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_UPLOAD}`
      
      try {
        const response = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        connectionStatus.recordSuccess()

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: "Failed to upload file" }))
          throw new Error(error.message || `HTTP ${response.status}`)
        }

        // Handle empty response body (as per API docs)
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text()
          if (text) {
            const data = JSON.parse(text)
            return data.data || data || { url: "", fileId: "" }
          }
        }

        // If no response body, return empty object (API might return success with no body)
        return { url: "", fileId: "" }
      } catch (error: any) {
        clearTimeout(timeoutId)
        connectionStatus.recordFailure()
        
        if (error.name === "AbortError") {
          throw new Error("Upload timeout. Please check your connection and try again.")
        }
        if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
          throw new Error("BACKEND_UNAVAILABLE")
        }
        throw error
      }
    } catch (error: any) {
      if (error.message === "BACKEND_UNAVAILABLE") {
        throw error
      }
      console.error("Failed to upload chat media:", error)
      throw error
    }
  }

  // Get upload info
  // GET https://team-quiickchatbackend.onrender.com/api/v1/chat/upload-info
  // Authorization: Bearer Token
  // Response: No response body (as per API docs)
  async getUploadInfo(): Promise<any> {
    try {
      // Full URL: https://team-quiickchatbackend.onrender.com/api/v1/chat/upload-info
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CHAT_UPLOAD_INFO)
      // Handle empty response body (as per API docs)
      if (!response || Object.keys(response).length === 0) {
        return {}
      }
      return response.data || response
    } catch (error: any) {
      // Only log if backend was previously available
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to get upload info:", error)
      }
      // Return empty object if backend is unavailable
      if (error.message === "BACKEND_UNAVAILABLE") {
        return {}
      }
      throw error
    }
  }

  // Send message with media (backend expects media_url, message_type, optional receiver_id)
  async sendMediaMessage(
    chatId: string,
    file: File,
    type: "image" | "file" | "audio" | "video",
    receiverId?: string
  ): Promise<Message> {
    try {
      const uploadResult = await this.uploadChatMedia(file)
      const endpoint = API_CONFIG.ENDPOINTS.MESSAGE_SEND.replace(":id", chatId)
      const body: Record<string, string | number> = {
        media_url: uploadResult.url,
        message_type: type === "image" ? "image" : type === "video" ? "video" : type === "audio" ? "audio" : "file",
      }
      if (receiverId) body.receiver_id = receiverId
      const response = await apiClient.post(endpoint, body)
      const d = response.data || response
      const mediaUrl = d.media_url ?? d.mediaUrl ?? uploadResult.url
      return {
        id: d.id ?? d.message_id,
        chatId: d.chat_id ?? chatId,
        senderId: d.sender_id ?? this.getCurrentUserId(),
        senderName: "",
        content: d.content ?? (mediaUrl ? "[Media]" : ""),
        mediaUrl,
        timestamp: d.timestamp ?? d.created_at ?? new Date().toISOString(),
        status: "sending",
        isOwn: true,
        type: (d.message_type ?? type) as "text" | "image" | "file" | "audio" | "video",
      }
    } catch (error) {
      console.error("Failed to send media message:", error)
      throw error
    }
  }

  // Get current user ID from token (primary identifier)
  private getCurrentUserId(): string {
    const ids = this.getCurrentUserIdentifiers()
    return ids[0] ?? ""
  }

  // Get all possible current user identifiers (id, phone, etc.) for isOwn comparison
  private getCurrentUserIdentifiers(): string[] {
    if (typeof window === "undefined") return []

    const token = localStorage.getItem("authToken")
    if (!token) {
      const stored = localStorage.getItem("userId")
      return stored ? [stored] : []
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const ids = [
        payload.userId ?? payload.user_id,
        payload.sub,
        payload.id,
        payload.phone ?? payload.phone_number,
      ].filter(Boolean)
      if (ids.length) return ids
    } catch {
      // ignore
    }
    const stored = localStorage.getItem("userId")
    return stored ? [stored] : []
  }
}

export const chatService = new ChatService()

