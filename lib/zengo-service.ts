// Zengo (Zego IM) service - uses local backend as proxy to Zego IM
// Handles online status, user info, and user registration for both web and backend sync

import { apiClient, API_CONFIG } from "./api-config"

export interface ZengoUserInfo {
  userId: string
  userName?: string
  userAvatar?: string
}

export interface ZengoOnlineStatusResult {
  userId: string
  online: boolean
  lastSeen?: number
}

export class ZengoService {
  /**
   * Register current user with Zego IM via backend (call after login)
   */
  async registerCurrentUser(): Promise<boolean> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.Z_REGISTER, {})
      return true
    } catch (error: any) {
      if (error?.message === "BACKEND_UNAVAILABLE") return false
      console.error("[Zengo] Failed to register user:", error)
      return false
    }
  }

  /**
   * Get online status for user IDs (via backend -> Zego IM)
   */
  async getOnlineStatus(userIds: string[]): Promise<ZengoOnlineStatusResult[]> {
    if (!userIds.length) return []
    try {
      const path = `${API_CONFIG.ENDPOINTS.Z_ONLINE_STATUS}?user_ids=${userIds.join(",")}`
      const response = await apiClient.get(path)
      const data = response?.data ?? response
      if (Array.isArray(data)) return data
      const list = data?.UserList ?? data?.user_list ?? data?.data
      if (!Array.isArray(list)) return []
      return list.map((u: any) => ({
        userId: u.UserID ?? u.user_id ?? u.userId ?? "",
        online: u.Online ?? u.online ?? false,
        lastSeen: u.LastSeen ?? u.last_seen,
      }))
    } catch {
      return []
    }
  }

  /**
   * Get user info from Zego IM via backend. Never throws: returns [] on any failure
   * so chat list and other features still work when Zengo is unavailable.
   */
  async getUserInfo(userIds: string[]): Promise<ZengoUserInfo[]> {
    if (!userIds.length) return []
    try {
      const path = `${API_CONFIG.ENDPOINTS.Z_USERS_INFO}?user_ids=${userIds.join(",")}`
      const response = await apiClient.get(path)
      const data = response.data ?? response
      const list = data?.UserList ?? data?.user_list ?? data?.data
      if (!Array.isArray(list)) return []
      return list.map((u: any) => ({
        userId: u.UserID ?? u.user_id ?? u.userId,
        userName: u.UserName ?? u.user_name ?? u.userName,
        userAvatar: u.UserAvatar ?? u.user_avatar ?? u.userAvatar,
      }))
    } catch (_) {
      return []
    }
  }

  /**
   * Check if Zengo (Zego IM) is enabled on backend
   */
  async getServiceStatus(): Promise<{ enabled: boolean; configured: boolean }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.Z_STATUS)
      const data = response.data ?? response
      return {
        enabled: data?.enabled ?? false,
        configured: data?.configured ?? false,
      }
    } catch (error: any) {
      if (error?.message === "BACKEND_UNAVAILABLE") return { enabled: false, configured: false }
      console.error("[Zengo] Failed to get service status:", error)
      return { enabled: false, configured: false }
    }
  }
}

export const zengoService = new ZengoService()
