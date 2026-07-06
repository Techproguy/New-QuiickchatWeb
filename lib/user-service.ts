// User service for profile and account management
import { apiClient, API_CONFIG } from "./api-config"

export interface UserProfile {
  id: string
  name: string
  phone: string
  about?: string
  avatar?: string
  email?: string
  status?: string
  isOnline?: boolean
}

export interface UpdateProfileData {
  name?: string
  about?: string
  status?: string
}

export class UserService {
  // Get user profile (real backend: GET /api/v1/users/me)
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE)
      const raw = response?.data ?? response?.user ?? response ?? {}
      const user = raw?.data ?? raw
      return {
        id: user.id ?? raw.id ?? "",
        name: (user.username ?? user.name ?? raw.username ?? raw.name ?? "").trim(),
        phone: user.phone ?? raw.phone ?? "",
        about: user.bio ?? raw.bio ?? user.about ?? raw.about ?? "",
        avatar: user.profile_picture ?? raw.profile_picture ?? user.avatar ?? raw.avatar,
        email: user.email ?? raw.email,
        status: user.status ?? raw.status,
        isOnline: user.is_online ?? raw.is_online,
      }
    } catch (error: any) {
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to fetch user profile:", error)
      }
      throw error
    }
  }

  // Update user profile (real backend: PUT /api/v1/users/update-profile)
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const body: Record<string, string> = {}
      // Backend expects "name" for display name (can include spaces). "username" is a handle (no spaces).
      if (data.name != null && data.name.trim() !== "") {
        body.name = data.name.trim()
      }
      if (data.about != null) body.bio = data.about
      if (data.status != null) body.status = data.status
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.USER_UPDATE, body)
      const raw = response?.data ?? response ?? {}
      return {
        id: raw.id,
        name: raw.username ?? raw.name,
        phone: raw.phone,
        about: raw.bio ?? raw.about,
        avatar: raw.profile_picture ?? raw.avatar,
        email: raw.email,
        status: raw.status,
        isOnline: raw.is_online,
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = apiClient.getToken()
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_AVATAR}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to upload avatar" }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const avatar = data?.data?.profile_picture ?? data?.profile_picture ?? data?.avatar ?? data?.data?.avatar
      return { avatar }
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      throw error
    }
  }

  // Request data export
  async requestDataExport(): Promise<{ downloadUrl?: string }> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.USER_EXPORT_DATA)
      const data = response?.data ?? response ?? {}
      return { downloadUrl: data.download_url ?? data.downloadUrl }
    } catch (error) {
      console.error("Failed to request data export:", error)
      throw error
    }
  }

  // Delete account
  async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.USER_DELETE)
    } catch (error) {
      console.error("Failed to delete account:", error)
      throw error
    }
  }
}

export const userService = new UserService()
