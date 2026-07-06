// Calls service for managing voice and video calls
import { apiClient, API_CONFIG } from "./api-config"

export interface Call {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: "voice" | "video"
  direction: "incoming" | "outgoing"
  status: "missed" | "answered" | "rejected" | "ongoing" | "ended"
  duration?: number // in seconds
  timestamp: string
  isGroup?: boolean
  participants?: string[]
}

export interface CallHistory {
  calls: Call[]
  total: number
}

export class CallsService {
  // Get call history (real backend: /api/v1/calls)
  async getCalls(limit = 50, offset = 0): Promise<Call[]> {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.CALLS_LIST}?limit=${limit}&offset=${offset}`)
      const raw = response?.data ?? response
      const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.calls ?? []
      return (list as any[]).map((c) => this.mapCall(c))
    } catch (error: any) {
      // Only log if backend was previously available
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to fetch calls:", error)
      }
      // Return empty array when backend is unavailable
      return []
    }
  }

  private mapCall(c: any): Call {
    const ts = c.timestamp ?? c.created_at ?? c.ended_at ?? c.started_at ?? new Date().toISOString()
    const statusMap: Record<string, Call["status"]> = {
      missed: "missed",
      declined: "rejected",
      answered: "answered",
      ended: "ended",
      initiated: "ongoing",
      ringing: "ongoing",
    }
    return {
      id: c.id ?? c.call_id ?? "",
      userId: c.user_id ?? c.receiver_id ?? c.caller_id ?? "",
      userName: c.user_name ?? c.userName ?? c.display_name ?? "",
      userAvatar: c.user_avatar ?? c.userAvatar ?? c.profile_picture,
      type: c.call_type === "video" ? "video" : "voice",
      direction: (c.direction === "incoming" ? "incoming" : "outgoing") as Call["direction"],
      status: statusMap[c.status] ?? "ended",
      duration: c.duration_seconds ?? c.duration,
      timestamp: typeof ts === "string" ? ts : ts?.toISOString?.() ?? new Date().toISOString(),
    }
  }

  // Initiate a call (backend expects receiver_id, call_type: 'audio'|'video')
  async initiateCall(userId: string, type: "voice" | "video" = "voice"): Promise<Call> {
    try {
      const callType = type === "voice" ? "audio" : "video"
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CALL_INITIATE, {
        receiver_id: userId,
        call_type: callType,
      })
      const d = response.data || response
      return {
        id: d.id ?? d.call_id,
        userId: d.receiver_id ?? userId,
        userName: "",
        userAvatar: undefined,
        type: d.call_type === "audio" ? "voice" : "video",
        direction: "outgoing",
        status: (d.status ?? "ongoing") as Call["status"],
        duration: d.duration_seconds,
        timestamp: d.created_at ?? new Date().toISOString(),
        isGroup: d.is_group,
        participants: d.participant_ids,
      }
    } catch (error) {
      console.error("Failed to initiate call:", error)
      throw error
    }
  }

  // Answer a call (send device: 'web' so backend can notify other devices that call was answered on web)
  async answerCall(callId: string, device: "phone" | "web" = "web"): Promise<Call> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.CALL_ANSWER.replace(":id", callId)
      const response = await apiClient.post(endpoint, { device })
      return response.data || response
    } catch (error) {
      console.error("Failed to answer call:", error)
      throw error
    }
  }

  // End a call (send empty body so request has valid JSON when Content-Type is application/json)
  async endCall(callId: string): Promise<void> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.CALL_END.replace(":id", callId)
      await apiClient.post(endpoint, {})
    } catch (error) {
      console.error("Failed to end call:", error)
      throw error
    }
  }

  // Get call status
  async getCallStatus(callId: string): Promise<Call> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.CALL_STATUS.replace(":id", callId)
      const response = await apiClient.get(endpoint)
      return response.data || response
    } catch (error) {
      console.error("Failed to get call status:", error)
      throw error
    }
  }

  // Initiate group call (backend uses receiver_id; use first participant for now)
  async initiateGroupCall(participantIds: string[], type: "voice" | "video" = "voice"): Promise<Call> {
    try {
      const primary = participantIds[0]
      if (!primary) throw new Error("At least one participant required")
      const call = await this.initiateCall(primary, type)
      return { ...call, isGroup: true, participants: participantIds }
    } catch (error) {
      console.error("Failed to initiate group call:", error)
      throw error
    }
  }
}

export const callsService = new CallsService()



