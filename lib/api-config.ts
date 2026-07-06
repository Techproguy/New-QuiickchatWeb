import { ZEGO_CONFIG } from './zego-config'
import { connectionStatus } from './connection-status'

// API base path - can be overridden via environment variable
const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api/v1"

// Default to the hosted backend so production builds work without local IPs.
// Override with NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_WEBSOCKET_URL for local development.
const DEFAULT_BACKEND = "https://team-quiickchatbackend.onrender.com"
const DEFAULT_WS = "wss://team-quiickchatbackend.onrender.com"

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BACKEND,
  BASE_PATH: API_BASE_PATH,
  ENDPOINTS: {
    // QR Authentication (Real API)
    QR_GENERATE: "/api/v1/qr/generate",
    QR_STATUS: "/api/v1/qr/status",

    // Authentication endpoints
    AUTH_INIT: "/api/v1/auth/init",
    LOGIN: "/api/v1/auth/login",
    VERIFY_LOGIN: "/api/v1/auth/verify-login",
    REGISTER: "/api/v1/auth/register",
    VERIFY: "/api/v1/auth/verify",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    RESEND_CODE: "/api/v1/auth/resend-code",

    // User Management (aligned with backend /api/v1/users)
    USER_PROFILE: "/api/v1/users/me",
    USER_UPDATE: "/api/v1/users/update-profile",
    USER_AVATAR: "/api/v1/users/upload-profile-picture",
    USER_STATUS: "/api/v1/users/me", // status via update-profile; use me for now
    USER_INIT: "/api/v1/auth/init",
    USER_CHECK_BLOCKSHIP: "/api/v1/z/users/check-blockship",
    USER_DELETE: "/api/v1/users/delete-account",
    USER_EXPORT_DATA: "/api/v1/user/export-data", // not yet on backend

    // Contacts (backend /api/v1/contacts)
    CONTACTS_LIST: "/api/v1/contacts",
    CONTACTS_UPLOAD: "/api/v1/contacts/upload",
    CONTACTS_SYNC: "/api/v1/contacts/sync",

    // Chats
    CHATS_LIST: "/api/v1/chats",
    CHAT_MESSAGES: "/api/v1/chats/:id/messages",
    CHAT_CREATE: "/api/v1/chats/create",
    CHAT_DELETE: "/api/v1/chats/:id",
    CHATS_CONTACTS: "/api/v1/chats/contacts",
    MESSAGE_SEND: "/api/v1/chats/:id/messages",
    MESSAGE_DELETE: "/api/v1/messages/:id",
    MESSAGE_TRANSLATE: "/api/v1/messages/:id/translate",
    TRANSLATE_TEXT: "/api/v1/translate",

    // Calls
    CALLS_LIST: "/api/v1/calls",
    CALL_INITIATE: "/api/v1/calls/initiate",
    CALL_ANSWER: "/api/v1/calls/:id/answer",
    CALL_END: "/api/v1/calls/:id/end",
    CALL_STATUS: "/api/v1/calls/:id/status",

    // Settings (aligned with backend /api/v1/settings)
    SETTINGS_GET: "/api/v1/settings",
    SETTINGS_UPDATE: "/api/v1/settings",
    SETTINGS_SECTION: "/api/v1/settings/:section",
    SETTINGS_PRIVACY: "/api/v1/settings/privacy",
    SETTINGS_NOTIFICATIONS: "/api/v1/settings/notifications",
    NOTIFICATIONS_UPDATE: "/api/v1/settings/notifications",
    PRIVACY_UPDATE: "/api/v1/settings/privacy",
    WALLPAPER_GET: "/api/v1/settings/wallpaper",
    WALLPAPER_UPDATE: "/api/v1/settings/wallpaper",
    WALLPAPER_UPLOAD: "/api/v1/settings/wallpaper",
    STARRED_MESSAGES: "/api/v1/settings/starred-messages",
    STARRED_MESSAGES_REMOVE: "/api/v1/settings/starred-messages/:messageId",

    // File Upload
    FILE_UPLOAD: "/api/v1/upload",
    FILE_DELETE: "/api/v1/upload/:id",
    
    // Chat Media Upload
    CHAT_UPLOAD: "/api/v1/chat/upload",
    CHAT_UPLOAD_INFO: "/api/v1/chat/upload-info",
    
    // Status Updates (aligned with backend /api/v1/status)
    STATUS_LIST: "/api/v1/status",
    STATUS_FEED: "/api/v1/status/feed",
    STATUS_ME: "/api/v1/status/me",
    STATUS_CONTACTS: "/api/v1/status/contacts",
    STATUS_CREATE: "/api/v1/status",
    STATUS_UPLOAD: "/api/v1/status/upload",
    STATUS_VIEW: "/api/v1/status/view",
    STATUS_VIEWS: "/api/v1/status/:id/views",
    STATUS_DELETE: "/api/v1/status/:id",
    STATUS_PRIVACY: "/api/v1/status/privacy",

    // Zego/Zengo (backend proxy to Zego IM: online status, user info, register)
    Z_STATUS: "/api/v1/z/status",
    Z_ONLINE_STATUS: "/api/v1/z/users/online-status",
    Z_USERS_INFO: "/api/v1/z/users/info",
    Z_REGISTER: "/api/v1/z/register",
    Z_FRIENDS_LIST: "/api/v1/z/friends/list",
    Z_BLOCKLIST: "/api/v1/z/users/blocklist",
    
    // Recent Activity
    ACTIVITY_RECENT: "/api/v1/activity/recent",
    
    // Friends Management
    FRIENDS_UPDATE_ALIAS: "/api/v1/z/friends/update-alias",
    FRIENDS_UPDATE_ATTRIBUTES: "/api/v1/z/friends/update-attributes",
  },

  // Request timeout in ms (increase if backend or network is slow)
  REQUEST_TIMEOUT_MS: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 60000,

  // Request headers
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // WebSocket configuration (backend serves at /status-updates)
  WEBSOCKET: {
    URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || `${DEFAULT_WS}/status-updates`,
    EVENTS: {
      MESSAGE_RECEIVED: "message:received",
      MESSAGE_SENT: "message:sent",
      USER_ONLINE: "user:online",
      USER_OFFLINE: "user:offline",
      CALL_INCOMING: "call:incoming",
      CALL_ENDED: "call:ended",
      TYPING_START: "typing:start",
      TYPING_STOP: "typing:stop",
    },
  },
} as const

// Updated API Client for real backend
export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private refreshTokenValue: string | null = null
  private isRefreshing = false
  private refreshPromise: Promise<{ access_token: string; refresh_token?: string }> | null = null

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("authToken")
      this.refreshTokenValue = localStorage.getItem("refreshToken")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token)
    }
  }

  setRefreshToken(refreshToken: string) {
    this.refreshTokenValue = refreshToken
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", refreshToken)
    }
  }

  clearToken() {
    this.token = null
    this.refreshTokenValue = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
      localStorage.removeItem("refreshToken")
    }
  }

  getToken(): string | null {
    return this.token
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue
  }

  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = { ...API_CONFIG.HEADERS, ...additionalHeaders }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }
    return headers
  }

  // QR Code - use Next.js proxy in browser to avoid CORS / "Failed to fetch" when backend unreachable
  async generateQRCode(deviceFingerprint: string) {
    const url = typeof window !== "undefined"
      ? "/api/proxy/qr/generate"
      : `${this.baseUrl}${API_CONFIG.ENDPOINTS.QR_GENERATE}`
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders({
        "X-Device-Fingerprint": deviceFingerprint,
      }),
      body: JSON.stringify({
        session_type: "login",
        device_fingerprint: deviceFingerprint,
        remember_me: true,
        session_duration_days: 14,
      }),
    })
    return this.handleResponse(response)
  }

  async checkQRStatus(sessionId: string) {
    const url = typeof window !== "undefined"
      ? `/api/proxy/qr/status/${sessionId}`
      : `${this.baseUrl}${API_CONFIG.ENDPOINTS.QR_STATUS}/${sessionId}`
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Check your connection and try again.")
      }
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        throw new Error("Connection failed. Ensure the server is running and try again.")
      }
      throw error
    }
  }

  // Refresh token
  async refreshToken(token?: string): Promise<{ access_token: string; refresh_token?: string }> {
    const tokenToUse = token || this.refreshTokenValue
    if (!tokenToUse) {
      throw new Error("No refresh token available")
    }

    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    // Start refresh process
    this.isRefreshing = true
    this.refreshPromise = (async (): Promise<{ access_token: string; refresh_token?: string }> => {
      try {
        const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            refresh_token: tokenToUse,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to refresh token")
        }

        const data = await response.json()
        
        // Update tokens
        if (data.access_token) {
          this.setToken(data.access_token)
        }
        if (data.refresh_token) {
          this.setRefreshToken(data.refresh_token)
        }

        return data
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  // Resend verification code
  async resendCode(phone: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.RESEND_CODE}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        phone,
      }),
    })
    return this.handleResponse(response)
  }

  // Initialize user (auth init endpoint)
  async initializeUser(): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH_INIT}`, {
      method: "GET",
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async get(endpoint: string) {
    // Check if backend is available before making request
    if (!connectionStatus.isAvailable()) {
      // Backend is known to be unavailable, throw silent error
      throw new Error("BACKEND_UNAVAILABLE")
    }

    const controller = new AbortController()
    const timeoutMs = API_CONFIG.REQUEST_TIMEOUT_MS
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      // Handle 404 as route not implemented (don't mark backend as unavailable)
      if (response.status === 404) {
        const notFoundError = new Error("Route not found")
        ;(notFoundError as any).isNotFound = true
        ;(notFoundError as any).statusCode = 404
        throw notFoundError
      }
      
      // Only record success for non-404 responses
      connectionStatus.recordSuccess()
      return this.handleResponse(response)
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Don't mark backend as unavailable for 404s (route just doesn't exist yet)
      if (error.isNotFound || error.statusCode === 404) {
        throw error
      }
      
      // Record failure only for actual network/backend errors
      connectionStatus.recordFailure()
      
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection and try again.")
      }
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        throw new Error("BACKEND_UNAVAILABLE")
      }
      throw error
    }
  }

  async post(endpoint: string, data?: unknown, additionalHeaders?: Record<string, string>) {
    // Check if backend is available before making request
    if (!connectionStatus.isAvailable()) {
      throw new Error("BACKEND_UNAVAILABLE")
    }

    const controller = new AbortController()
    const timeoutMs = API_CONFIG.REQUEST_TIMEOUT_MS
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(additionalHeaders),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      // Handle 404 as route not implemented (don't mark backend as unavailable)
      if (response.status === 404) {
        const notFoundError = new Error("Route not found")
        ;(notFoundError as any).isNotFound = true
        ;(notFoundError as any).statusCode = 404
        throw notFoundError
      }
      
      // Only record success for non-404 responses
      connectionStatus.recordSuccess()
      return this.handleResponse(response)
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Don't mark backend as unavailable for 404s (route just doesn't exist yet)
      if (error.isNotFound || error.statusCode === 404) {
        throw error
      }
      
      // Record failure only for actual network/backend errors
      connectionStatus.recordFailure()
      
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection and try again.")
      }
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        throw new Error("BACKEND_UNAVAILABLE")
      }
      throw error
    }
  }

  async put(endpoint: string, data?: unknown) {
    // Check if backend is available before making request
    if (!connectionStatus.isAvailable()) {
      throw new Error("BACKEND_UNAVAILABLE")
    }

    const controller = new AbortController()
    const timeoutMs = API_CONFIG.REQUEST_TIMEOUT_MS
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      // Handle 404 as route not implemented (don't mark backend as unavailable)
      if (response.status === 404) {
        const notFoundError = new Error("Route not found")
        ;(notFoundError as any).isNotFound = true
        ;(notFoundError as any).statusCode = 404
        throw notFoundError
      }
      
      // Only record success for non-404 responses
      connectionStatus.recordSuccess()
      return this.handleResponse(response)
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Don't mark backend as unavailable for 404s (route just doesn't exist yet)
      if (error.isNotFound || error.statusCode === 404) {
        throw error
      }
      
      // Record failure only for actual network/backend errors
      connectionStatus.recordFailure()
      
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection and try again.")
      }
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        throw new Error("BACKEND_UNAVAILABLE")
      }
      throw error
    }
  }

  async delete(endpoint: string) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection and try again.")
      }
      throw error
    }
  }

  private async handleResponse(response: Response) {
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.getRefreshToken() && !this.isRefreshing) {
      try {
        await this.refreshToken()
        // Retry the original request with new token
        // Note: This is a simplified retry - in production, you might want to retry the original request
        throw new Error("Token expired. Please try again.")
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        this.clearToken()
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Session expired. Please login again.")
      }
    }

    if (!response.ok) {
      // Try to get error message from response (including validation detail)
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error ||
          (typeof errorData.detail === "string"
            ? errorData.detail
            : Array.isArray(errorData.detail)
              ? errorData.detail
                  .map((d: any) => (d?.msg ?? d?.message ?? JSON.stringify(d)).toString())
                  .join(". ")
              : errorData.detail)
            || (errorData.errors && typeof errorData.errors === "object"
              ? Object.entries(errorData.errors)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join(". ")
              : null) ||
          errorMessage
      } catch {
        // If response is not JSON, try to get text
        try {
          const text = await response.text()
          if (text) {
            errorMessage = text
          }
        } catch {
          // If all else fails, use status text
          errorMessage = response.statusText || errorMessage
        }
      }
      
      // For 404 errors, include a flag to indicate route not found
      if (response.status === 404) {
        const notFoundError = new Error(errorMessage)
        ;(notFoundError as any).isNotFound = true
        ;(notFoundError as any).statusCode = 404
        throw notFoundError
      }
      
      throw new Error(errorMessage)
    }
    
    // Handle empty or JSON responses (allow empty body when content-type is application/json)
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const text = await response.text()
      if (!text || text.trim() === "") return {}
      try {
        return JSON.parse(text)
      } catch {
        return {}
      }
    }
    
    return {}
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
