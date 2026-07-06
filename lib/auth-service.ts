// Authentication service for managing auth state and tokens
import { apiClient, API_CONFIG } from "./api-config"

/** Minimum session duration in days for web login (backend should honor remember_me / session_duration) */
export const SESSION_DURATION_DAYS = 14

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface PhoneLoginResult {
  phone: string
  sms_sent: boolean
}

export interface VerifyLoginResult {
  user: Record<string, unknown>
  auth_tokens: { access_token: string; refresh_token?: string; token_type?: string }
}

export class AuthService {
  /**
   * Request OTP for phone login (same as mobile)
   */
  async loginWithPhone(phone: string): Promise<PhoneLoginResult> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, { phone })
    const data = response.data ?? response
    return {
      phone: data.phone ?? data.data?.phone ?? phone,
      sms_sent: data.sms_sent ?? data.data?.sms_sent ?? true,
    }
  }

  /**
   * Verify OTP and complete phone login (same as mobile)
   * Passes remember_me and session_duration_days so backend can issue 14-day refresh tokens
   */
  async verifyLoginWithCode(phone: string, code: string): Promise<AuthTokens> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.VERIFY_LOGIN, {
      phone,
      code,
      remember_me: true,
      session_duration_days: SESSION_DURATION_DAYS,
    })
    const data = response.data ?? response
    const tokens = data.auth_tokens ?? data.data?.auth_tokens ?? data
    const accessToken = tokens.access_token ?? tokens.accessToken
    const refreshToken = tokens.refresh_token ?? tokens.refreshToken
    if (!accessToken) throw new Error("No access token received")
    return { accessToken, refreshToken: refreshToken ?? "" }
  }

  /**
   * Register (send OTP) – for new users
   */
  async registerWithPhone(phone: string): Promise<{ phone: string; sms_sent: boolean }> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, { phone })
    const data = response.data ?? response
    return {
      phone: data.phone ?? data.data?.phone ?? phone,
      sms_sent: data.sms_sent ?? data.data?.sms_sent ?? true,
    }
  }

  /**
   * Verify OTP and complete registration
   */
  async verifyRegistration(phone: string, code: string): Promise<AuthTokens> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.VERIFY, { phone, code })
    const data = response.data ?? response
    const tokens = data.auth_tokens ?? data.data?.auth_tokens ?? data
    const accessToken = tokens.access_token ?? tokens.accessToken
    const refreshToken = tokens.refresh_token ?? tokens.refreshToken
    if (!accessToken) throw new Error("No access token received")
    return { accessToken, refreshToken: refreshToken ?? "" }
  }

  // Store tokens after successful authentication
  setAuthTokens(tokens: AuthTokens) {
    apiClient.setToken(tokens.accessToken)
    apiClient.setRefreshToken(tokens.refreshToken)
  }

  // Clear all auth data
  clearAuth() {
    apiClient.clearToken()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!apiClient.getToken()
  }

  // Get current access token
  getAccessToken(): string | null {
    return apiClient.getToken()
  }

  // Get current refresh token
  getRefreshToken(): string | null {
    return apiClient.getRefreshToken()
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const data = await apiClient.refreshToken(refreshToken)
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    }
  }

  // Resend verification code
  async resendVerificationCode(phone: string): Promise<void> {
    await apiClient.resendCode(phone)
  }

  // Initialize user (first-time setup)
  async initializeUser(): Promise<any> {
    return await apiClient.initializeUser()
  }

  // Auto-refresh token before it expires (call this periodically)
  async autoRefreshToken(): Promise<void> {
    if (!this.isAuthenticated()) {
      return
    }

    try {
      // Check if token is about to expire (you can decode JWT to check expiry)
      // For now, we'll just try to refresh if we have a refresh token
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        await this.refreshAccessToken()
      }
    } catch (error) {
      console.error("Failed to auto-refresh token:", error)
      // If refresh fails, clear auth and redirect to login
      this.clearAuth()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()

// Auto-refresh token every 15 minutes (adjust based on your token expiry)
if (typeof window !== "undefined") {
  setInterval(() => {
    authService.autoRefreshToken().catch(console.error)
  }, 15 * 60 * 1000) // 15 minutes
}

