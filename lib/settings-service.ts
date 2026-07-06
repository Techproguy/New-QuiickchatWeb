// Settings service for managing user settings
import { apiClient, API_CONFIG } from "./api-config"

export interface NotificationSettings {
  messages: boolean
  groups: boolean
  status: boolean
  showPreview: boolean
  playSoundForOutgoing: boolean
  backgroundSync: boolean
}

export interface PrivacySettings {
  lastSeen: "everyone" | "contacts" | "nobody"
  profilePhoto: "everyone" | "contacts" | "nobody"
  about: "everyone" | "contacts" | "nobody"
  status: "everyone" | "contacts" | "nobody"
  readReceipts: boolean
  disappearingMessages: "off" | "24h" | "7d" | "90d"
  groups: "everyone" | "contacts" | "contacts_except"
}

export interface AccountSettings {
  twoStepEnabled: boolean
  linkedDevices?: Array<{
    id: string
    name: string
    type: string
    lastActive: string
  }>
}

export interface Settings {
  notifications?: NotificationSettings
  privacy?: PrivacySettings
  account?: AccountSettings
  wallpaper?: string
  language?: string
}

// Map backend 'everybody'|'contacts'|'nobody' to web 'everyone'|'contacts'|'nobody'
const toWebVisibility = (v?: string): "everyone" | "contacts" | "nobody" =>
  v === "everybody" ? "everyone" : (v === "contacts" || v === "nobody" ? v : "everyone")
const toBackendVisibility = (v: string): "everybody" | "contacts" | "nobody" =>
  v === "everyone" ? "everybody" : (v === "contacts" || v === "nobody" ? v : "everybody")
// The "groups" setting uses 'contacts_except' instead of 'nobody'
const toWebGroupsVisibility = (v?: string): "everyone" | "contacts" | "contacts_except" =>
  v === "everybody" ? "everyone" : (v === "contacts" || v === "contacts_except" ? v : "everyone")
const toBackendGroupsVisibility = (v: string): "everybody" | "contacts" | "contacts_except" =>
  v === "everyone" ? "everybody" : (v === "contacts" || v === "contacts_except" ? v : "everybody")

export class SettingsService {
  // Get all settings (real backend: GET /api/v1/settings)
  async getSettings(): Promise<Settings> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SETTINGS_GET)
      const raw = response?.data ?? response ?? {}
      return raw
    } catch (error: any) {
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to fetch settings:", error)
      }
      return {}
    }
  }

  // Update general settings
  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.SETTINGS_UPDATE, settings)
      return response.data || response
    } catch (error) {
      console.error("Failed to update settings:", error)
      throw error
    }
  }

  // Get notification settings (real backend: GET /api/v1/settings or GET /api/v1/settings/notifications)
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      let n: any
      try {
        const res = await apiClient.get(API_CONFIG.ENDPOINTS.SETTINGS_NOTIFICATIONS)
        n = res?.data ?? res
      } catch {
        const s = await this.getSettings()
        n = s?.notifications ?? (s as any)?.notification_settings
      }
      if (!n) return this.defaultNotificationSettings()
      return {
        messages: n.message_notification ?? n.messages ?? true,
        groups: n.group_notification ?? n.groups ?? true,
        status: n.status ?? true,
        showPreview: n.show_preview ?? n.showPreview ?? true,
        playSoundForOutgoing: n.play_sound_for_outgoing ?? n.playSoundForOutgoing ?? false,
        backgroundSync: n.background_sync ?? n.backgroundSync ?? false,
      }
    } catch {
      return this.defaultNotificationSettings()
    }
  }

  private defaultNotificationSettings(): NotificationSettings {
    return {
      messages: true,
      groups: true,
      status: true,
      showPreview: true,
      playSoundForOutgoing: false,
      backgroundSync: false,
    }
  }

  // Update notification settings (real backend: PUT /api/v1/settings/notifications)
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const current = await this.getNotificationSettings()
      const merged = { ...current, ...settings }
      const body = {
        message_notification: merged.messages,
        group_notification: merged.groups,
        message_sound: merged.showPreview,
        group_sound: merged.playSoundForOutgoing,
      }
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UPDATE, body)
      const raw = response?.data ?? response
      return { ...this.defaultNotificationSettings(), ...this.mapNotificationFromBackend(raw) }
    } catch (error) {
      console.error("Failed to update notification settings:", error)
      throw error
    }
  }

  private mapNotificationFromBackend(n: any): Partial<NotificationSettings> {
    if (!n || typeof n !== "object") return {}
    return {
      messages: n.message_notification ?? n.messages,
      groups: n.group_notification ?? n.groups,
      status: n.status,
      showPreview: n.show_preview ?? n.showPreview,
      playSoundForOutgoing: n.play_sound_for_outgoing ?? n.playSoundForOutgoing,
      backgroundSync: n.background_sync ?? n.backgroundSync,
    }
  }

  // Get privacy settings (real backend: GET /api/v1/settings or GET /api/v1/settings/privacy)
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      let p: any
      try {
        const res = await apiClient.get(API_CONFIG.ENDPOINTS.SETTINGS_PRIVACY)
        p = res?.data ?? res
      } catch {
        const s = await this.getSettings()
        p = s?.privacy ?? (s as any)?.privacy_settings
      }
      if (!p) return this.defaultPrivacySettings()
      return {
        lastSeen: toWebVisibility(p.last_seen_visibility),
        profilePhoto: toWebVisibility(p.profile_picture_visibility ?? p.profile_photo_visibility),
        about: toWebVisibility(p.bio_visibility ?? p.about),
        status: toWebVisibility(p.status_visibility ?? p.status),
        readReceipts: p.read_receipts_enabled ?? p.readReceipts ?? true,
        disappearingMessages: (p.disappearing_messages ?? p.disappearingMessages ?? "off") as PrivacySettings["disappearingMessages"],
        groups: toWebGroupsVisibility(p.groups_visibility ?? p.groups ?? "everyone"),
      }
    } catch {
      return this.defaultPrivacySettings()
    }
  }

  private defaultPrivacySettings(): PrivacySettings {
    return {
      lastSeen: "everyone",
      profilePhoto: "contacts",
      about: "contacts",
      status: "contacts",
      readReceipts: true,
      disappearingMessages: "off",
      groups: "everyone",
    }
  }

  // Update privacy settings (real backend: PUT /api/v1/settings/privacy)
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const body: Record<string, string | boolean> = {}
      if (settings.lastSeen != null) body.last_seen_visibility = toBackendVisibility(settings.lastSeen)
      if (settings.profilePhoto != null) body.profile_picture_visibility = toBackendVisibility(settings.profilePhoto)
      if (settings.about != null) body.bio_visibility = toBackendVisibility(settings.about)
      if (settings.status != null) body.address_visibility = toBackendVisibility(settings.status) // backend has no status_visibility
      if (settings.readReceipts != null) body.read_receipts_enabled = settings.readReceipts
      if (settings.groups != null) body.phone_number_visibility = toBackendGroupsVisibility(settings.groups)
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.PRIVACY_UPDATE, body)
      const raw = response?.data ?? response
      return { ...this.defaultPrivacySettings(), ...this.mapPrivacyFromBackend(raw) }
    } catch (error) {
      console.error("Failed to update privacy settings:", error)
      throw error
    }
  }

  private mapPrivacyFromBackend(p: any): Partial<PrivacySettings> {
    if (!p || typeof p !== "object") return {}
    return {
      lastSeen: toWebVisibility(p.last_seen_visibility),
      profilePhoto: toWebVisibility(p.profile_picture_visibility),
      about: toWebVisibility(p.bio_visibility),
      status: toWebVisibility(p.status_visibility ?? p.address_visibility),
      readReceipts: p.read_receipts_enabled ?? p.readReceipts,
      disappearingMessages: p.disappearing_messages ?? p.disappearingMessages,
      groups: toWebGroupsVisibility(p.groups_visibility ?? p.phone_number_visibility),
    }
  }

  // Upload wallpaper
  async uploadWallpaper(file: File): Promise<{ wallpaper: string }> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = apiClient.getToken()
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WALLPAPER_UPLOAD}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to upload wallpaper" }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error("Failed to upload wallpaper:", error)
      throw error
    }
  }

  // Get wallpaper (real backend: GET /api/v1/settings/wallpaper)
  async getWallpaper(): Promise<{ wallpaper_url?: string }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.WALLPAPER_GET)
      const raw = response?.data ?? response ?? {}
      return { wallpaper_url: raw.wallpaper_url ?? raw.wallpaper }
    } catch (error) {
      console.error("Failed to fetch wallpaper:", error)
      return {}
    }
  }

  // Update wallpaper (real backend: PUT /api/v1/settings/wallpaper)
  async updateWallpaper(wallpaperId: string): Promise<void> {
    try {
      await apiClient.put(API_CONFIG.ENDPOINTS.WALLPAPER_UPDATE, { wallpaper_url: wallpaperId })
    } catch (error) {
      console.error("Failed to update wallpaper:", error)
      throw error
    }
  }

  // Get language (real backend: GET /api/v1/settings/language)
  async getLanguage(): Promise<{ language: string }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SETTINGS_SECTION.replace(":section", "language"))
      const raw = response?.data ?? response ?? {}
      return { language: raw.language ?? "en" }
    } catch (error) {
      console.error("Failed to fetch language:", error)
      return { language: "en" }
    }
  }

  // Update language (real backend: PUT /api/v1/settings/language)
  async updateLanguage(language: string): Promise<{ language: string }> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.SETTINGS_UPDATE + "/language", { language })
      const raw = response?.data ?? response ?? {}
      return { language: raw.language ?? language }
    } catch (error) {
      console.error("Failed to update language:", error)
      throw error
    }
  }

  // Get account settings (real backend: from GET /api/v1/settings)
  async getAccountSettings(): Promise<AccountSettings> {
    try {
      const s = await this.getSettings()
      const linked = (s as any)?.linked_devices ?? s?.account?.linkedDevices
      const devices = Array.isArray(linked)
        ? linked.map((d: any) => ({
            id: d.device_id ?? d.id,
            name: d.device_name ?? d.name ?? "Device",
            type: d.type ?? "unknown",
            lastActive: d.last_synced ?? d.lastActive ?? "",
          }))
        : []
      return {
        twoStepEnabled: (s as any)?.two_step_enabled ?? s?.account?.twoStepEnabled ?? false,
        linkedDevices: devices,
      }
    } catch {
      return { twoStepEnabled: false, linkedDevices: [] }
    }
  }

  // Update account settings
  async updateAccountSettings(settings: Partial<AccountSettings>): Promise<AccountSettings> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.SETTINGS_UPDATE, { account: settings })
      return response.data?.account || response.account || settings as AccountSettings
    } catch (error: any) {
      // Only log if backend was previously available
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to update account settings:", error)
      }
      throw error
    }
  }
}

export const settingsService = new SettingsService()



