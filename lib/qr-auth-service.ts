// QR Authentication Service
// Handles QR code generation and status checking for web login – backend only, no fallback

import { apiClient, API_CONFIG } from "./api-config"

export interface QRCodeResponse {
  session_id: string
  qr_code?: string
  qr_data?: string
  expires_in: number
  message?: string
}

export interface QRStatusResponse {
  status: "pending" | "scanned" | "approved" | "rejected" | "expired"
  authenticated: boolean
  token?: string
  access_token?: string
  refresh_token?: string
  message?: string
}

export class QRAuthService {
  /**
   * Generate QR code for web login – always from backend (no dev fallback)
   */
  async generateQRCode(deviceFingerprint?: string): Promise<QRCodeResponse> {
    const fingerprint = deviceFingerprint || this.generateDeviceFingerprint()

    const response = await apiClient.generateQRCode(fingerprint)

    if (response.data) {
      return {
        session_id: response.data.session_id || response.data.sessionId,
        qr_code: response.data.qr_code || response.data.qrCode,
        qr_data: response.data.qr_data || response.data.qrData,
        expires_in: (response.data.expires_in || response.data.expiresIn) ?? 900,
        message: response.data.message,
      }
    }

    return {
      session_id: response.session_id || response.sessionId,
      qr_code: response.qr_code || response.qrCode,
      qr_data: response.qr_data || response.qrData,
      expires_in: response.expires_in ?? response.expiresIn ?? 900,
      message: response.message,
    }
  }

  /**
   * Check QR code authentication status – backend only
   */
  async checkQRStatus(sessionId: string): Promise<QRStatusResponse> {
    const response = await apiClient.checkQRStatus(sessionId)

    if (response.data) {
      return {
        status: response.data.status || "pending",
        authenticated: response.data.authenticated ?? false,
        token: response.data.token,
        access_token: response.data.access_token || response.data.accessToken,
        refresh_token: response.data.refresh_token || response.data.refreshToken,
        message: response.data.message,
      }
    }

    return {
      status: response.status || "pending",
      authenticated: response.authenticated ?? false,
      token: response.token,
      access_token: response.access_token || response.accessToken,
      refresh_token: response.refresh_token || response.refreshToken,
      message: response.message,
    }
  }

  /**
   * Generate a device fingerprint for tracking
   */
  private generateDeviceFingerprint(): string {
    if (typeof window === "undefined") {
      return `server_${Date.now()}`
    }

    // Try to get existing fingerprint from localStorage
    let fingerprint = localStorage.getItem("deviceFingerprint")
    
    if (!fingerprint) {
      // Generate a unique fingerprint based on browser characteristics
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      ctx?.fillText("fingerprint", 2, 2)
      
      const canvasFingerprint = canvas.toDataURL()
      const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const language = navigator.language
      
      fingerprint = btoa(`${canvasFingerprint}-${screenInfo}-${timezone}-${language}-${Date.now()}`)
        .substring(0, 32)
      
      localStorage.setItem("deviceFingerprint", fingerprint)
    }
    
    return fingerprint
  }

  /**
   * Get QR code data URL for display
   * If backend returns qr_data, use it; otherwise generate from session_id
   */
  getQRCodeData(sessionId: string, qrData?: string): string {
    if (qrData) {
      return qrData
    }
    
    // Generate QR code data from session ID
    // Format: quickchat://qr-login?session_id=xxx
    const qrContent = `quickchat://qr-login?session_id=${sessionId}`
    return qrContent
  }
}

export const qrAuthService = new QRAuthService()

