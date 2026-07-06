// Activity service for recent activity and status updates
import { apiClient, API_CONFIG } from "./api-config"

function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return ""
  const t = url.trim()
  if (t.startsWith("http://") || t.startsWith("https://")) return t
  if (t.startsWith("/")) {
    const base = (API_CONFIG.BASE_URL || "").replace(/\/$/, "")
    return base ? `${base}${t}` : t
  }
  return t
}

export interface Activity {
  id: string
  type: "message" | "call" | "status"
  userId?: string
  userName: string
  userAvatar?: string
  activity: string
  timestamp: string
  chatId?: string
  callId?: string
  statusId?: string
  metadata?: Record<string, any>
}

export interface StatusUpdate {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  mediaUrl?: string
  mediaType?: "image" | "video" | "audio" | "text"
  timestamp: string
  views?: number
  viewedBy?: string[]
  // Optional snake_case aliases tolerated from raw backend payloads
  user_id?: string
  user_name?: string
}

export class ActivityService {
  // Get recent activity
  async getRecentActivity(limit = 50, offset = 0): Promise<Activity[]> {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ACTIVITY_RECENT}?limit=${limit}&offset=${offset}`)
      return response.data || response || []
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
      // Fallback: return empty array
      return []
    }
  }

  // Map backend status format to frontend StatusUpdate
  private mapStatusToUpdate(raw: any, userId: string, userName: string, userAvatar?: string): StatusUpdate {
    const created = raw.created_at ?? raw.createdAt
    return {
      id: raw.id ?? raw._id,
      userId: userId || raw.user_id,
      userName: userName || (raw.display_name ?? raw.user_name ?? "Unknown"),
      userAvatar: userAvatar ?? raw.profile_picture ?? raw.user_avatar,
      content: raw.caption ?? raw.content ?? "",
      mediaUrl: resolveMediaUrl(raw.content_url ?? raw.media_url),
      mediaType: (raw.content_type ?? raw.media_type ?? "text") as "image" | "video" | "audio" | "text",
      timestamp: typeof created === "string" ? created : created?.toISOString?.() ?? new Date().toISOString(),
      views: raw.view_count ?? raw.views,
      viewedBy: raw.viewed_by ?? [],
    }
  }

  // Get status feed (all contacts' statuses, like WhatsApp stories)
  async getStatusUpdates(): Promise<StatusUpdate[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STATUS_FEED)
      const data = response.data ?? response
      const groups = Array.isArray(data) ? data : (data?.data ?? [])
      if (!Array.isArray(groups)) return []

      const flat: StatusUpdate[] = []
      for (const group of groups) {
        const userId = group.phone_number ?? group.user_id
        const userName = group.display_name ?? ""
        const userAvatar = group.profile_picture
        const statuses = group.statuses ?? []
        for (const s of statuses) {
          flat.push(this.mapStatusToUpdate(s, userId, userName, userAvatar))
        }
      }
      return flat
    } catch (error) {
      console.error("Failed to fetch status updates:", error)
      return []
    }
  }

  // Get my statuses (real backend: GET /api/v1/status/me)
  async getMyStatusUpdates(profile?: { id?: string; phone?: string; name?: string; avatar?: string }): Promise<StatusUpdate[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STATUS_ME)
      const data = response.data ?? response
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      const uid = profile?.phone ?? profile?.id ?? ""
      const uname = profile?.name ?? "Me"
      const uavatar = profile?.avatar
      return list.map((s: any) => this.mapStatusToUpdate(s, uid, uname, uavatar))
    } catch (error) {
      console.error("Failed to fetch my status updates:", error)
      return []
    }
  }

  // Get contact statuses (summaries from backend)
  async getContactStatuses(): Promise<StatusUpdate[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STATUS_CONTACTS)
      const data = response.data ?? response
      return Array.isArray(data) ? data : (data?.data ?? [])
    } catch (error) {
      console.error("Failed to fetch contact statuses:", error)
      return []
    }
  }

  // Get status updates for a specific user (by userId/phone from feed)
  async getUserStatusUpdates(userId: string): Promise<StatusUpdate[]> {
    try {
      const all = await this.getStatusUpdates()
      return all.filter((s) => (s.userId ?? s.user_id) === userId)
    } catch (error) {
      console.error("Failed to fetch user status updates:", error)
      return []
    }
  }

  // Get single status by ID (real backend: GET /api/v1/status/:id)
  async getStatusById(statusId: string): Promise<StatusUpdate | null> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.STATUS_DELETE.replace(":id", statusId)
      const response = await apiClient.get(endpoint)
      const raw = response?.data ?? response ?? {}
      const userId = raw.user_id ?? raw.userId
      const userName = raw.display_name ?? raw.userName ?? ""
      const userAvatar = raw.profile_picture ?? raw.userAvatar
      return this.mapStatusToUpdate(raw, userId, userName, userAvatar)
    } catch (error) {
      console.error("Failed to fetch status by ID:", error)
      return null
    }
  }

  // Create a status update (text only -> POST /status; with media -> POST /status/upload)
  async createStatusUpdate(content: string, mediaFile?: File): Promise<StatusUpdate> {
    if (mediaFile) {
      const formData = new FormData()
      formData.append("file", mediaFile)
      formData.append("caption", content || "")
      formData.append("privacy_setting", "all_contacts")

      const token = apiClient.getToken()
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATUS_UPLOAD}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to upload status" }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const raw = data?.data ?? data ?? {}
      return this.mapStatusToUpdate(raw, raw?.user_id ?? "", raw?.display_name ?? "Me", raw?.profile_picture)
    }

    const response = await apiClient.post(API_CONFIG.ENDPOINTS.STATUS_CREATE, { content_type: "text", content: content || "" })
    const data = response.data ?? response
    const raw = data?.data ?? data
    return this.mapStatusToUpdate(raw, raw?.user_id ?? "", raw?.display_name ?? "Me", raw?.profile_picture)
  }

  // View a status update (backend expects POST /status/view with body { status_id }).
  // Never throws so the status viewer UI is never broken by view failures.
  async viewStatusUpdate(statusId: string): Promise<void> {
    if (!statusId?.trim()) return
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.STATUS_VIEW, { status_id: statusId.trim() })
    } catch {
      // Swallow all errors so viewing status never breaks the UI
    }
  }

  // Delete a status update
  async deleteStatusUpdate(statusId: string): Promise<void> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.STATUS_DELETE.replace(":id", statusId)
      await apiClient.delete(endpoint)
    } catch (error) {
      console.error("Failed to delete status update:", error)
      throw error
    }
  }

  // Translate arbitrary text (backend: POST /api/v1/translate with body { text, target_language })
  async translateText(text: string, targetLanguage: string = "en"): Promise<string> {
    try {
      if (!text?.trim()) return text || ""
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.TRANSLATE_TEXT, {
        text: text.trim(),
        target_language: targetLanguage,
      })
      const d = response.data ?? response
      return d.translated_content ?? d.translatedText ?? d.translated ?? text.trim()
    } catch (error) {
      console.error("Failed to translate text:", error)
      return text
    }
  }
}

export const activityService = new ActivityService()

