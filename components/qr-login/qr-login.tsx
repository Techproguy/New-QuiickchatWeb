"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { QRCodeDisplay } from "./qr-code-display"
import { qrAuthService, type QRCodeResponse, type QRStatusResponse } from "@/lib/qr-auth-service"
import { apiClient } from "@/lib/api-config"
import { Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRLoginProps {
  onSuccess?: () => void
  onUsePhone?: () => void
}

type QRStatus = "generating" | "waiting" | "scanned" | "approved" | "rejected" | "expired" | "error" | "unavailable"

// A missing backend QR route (e.g. "Route POST:/api/v1/qr/generate not found")
// or a 404/501 response means QR login isn't available on the server right now.
const isQRUnavailable = (msg: string): boolean => {
  const m = (msg || "").toLowerCase()
  return (
    m.includes("not found") ||
    m.includes("not implemented") ||
    m.includes("404") ||
    m.includes("501") ||
    m.includes("route post") ||
    m.includes("route get")
  )
}

export function QRLogin({ onSuccess, onUsePhone }: QRLoginProps) {
  const router = useRouter()
  const [qrData, setQrData] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const [status, setStatus] = useState<QRStatus>("generating")
  const [message, setMessage] = useState<string>("")
  const [expiresIn, setExpiresIn] = useState<number>(900)
  const [countdown, setCountdown] = useState<number>(900)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate QR code on mount
  useEffect(() => {
    generateQRCode()
    return () => {
      cleanup()
    }
  }, [])

  // Poll for status when waiting
  useEffect(() => {
    if (status === "waiting" && sessionId) {
      startPolling()
    } else {
      stopPolling()
    }
    return () => {
      stopPolling()
    }
  }, [status, sessionId])

  // Countdown timer
  useEffect(() => {
    if (status === "waiting" && expiresIn > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStatus("expired")
            setMessage("QR code expired. Please generate a new one.")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [status, expiresIn])

  const generateQRCode = async () => {
    try {
      setStatus("generating")
      setMessage("Generating QR code...")

      const response: QRCodeResponse = await qrAuthService.generateQRCode()
      
      setSessionId(response.session_id)
      setExpiresIn(response.expires_in)
      setCountdown(response.expires_in)

      // Get QR code data for display
      const qrDataToDisplay = response.qr_code || 
                             response.qr_data || 
                             qrAuthService.getQRCodeData(response.session_id, response.qr_data)
      
      setQrData(qrDataToDisplay)
      setStatus("waiting")
      setMessage("Scan this QR code with your mobile app")
    } catch (error: any) {
      console.error("Failed to generate QR code:", error)
      if (isQRUnavailable(error?.message || "")) {
        // The backend doesn't serve the QR login route — don't show the raw
        // "Route POST:/api/v1/qr/generate not found" error to the user.
        setStatus("unavailable")
        setMessage("QR login isn't available right now. Please sign in with your phone number instead.")
      } else {
        setStatus("error")
        setMessage(error.message || "Failed to generate QR code. Please check your connection and try again.")
      }
    }
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      return
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId) return

      try {
        const statusResponse: QRStatusResponse = await qrAuthService.checkQRStatus(sessionId)
        
        handleStatusUpdate(statusResponse)
      } catch (error: any) {
        const msg = error?.message || ""
        // Session expired or not found — expected when QR times out
        if (msg.toLowerCase().includes("session not found") || msg.toLowerCase().includes("session expired") || msg.toLowerCase().includes("expired")) {
          setStatus("expired")
          setMessage("QR code expired. Please generate a new one.")
          stopPolling()
        } else if (msg.includes("Connection failed") || msg.includes("Failed to fetch") || msg.includes("BACKEND_UNAVAILABLE")) {
          setStatus("error")
          setMessage("Unable to reach server. Check your connection and try again.")
        }
        console.error("Failed to check QR status:", error)
      }
    }, 2000) // Poll every 2 seconds
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const handleStatusUpdate = (statusResponse: QRStatusResponse) => {
    switch (statusResponse.status) {
      case "pending":
        setStatus("waiting")
        setMessage("Waiting for mobile app to scan...")
        break

      case "scanned":
        setStatus("scanned")
        setMessage("QR code scanned! Please approve on your mobile app.")
        break

      case "approved":
        setStatus("approved")
        setMessage("Login approved! Voice and video calls are available on web—redirecting...")
        stopPolling()
        
        // Store tokens and mark that web has calls (like WhatsApp Web)
        const accessToken = statusResponse.access_token || statusResponse.token
        const refreshToken = statusResponse.refresh_token

        if (accessToken) {
          apiClient.setToken(accessToken)
          if (refreshToken) {
            apiClient.setRefreshToken(refreshToken)
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("webCallsEnabled", "true")
          }

          // Redirect after short delay
          setTimeout(() => {
            if (onSuccess) {
              onSuccess()
            } else {
              router.push("/chat")
            }
          }, 1000)
        } else {
          setStatus("error")
          setMessage("Authentication failed: No token received")
        }
        break

      case "rejected":
        setStatus("rejected")
        setMessage("Login was rejected. Please try again.")
        stopPolling()
        break

      case "expired":
        setStatus("expired")
        setMessage("QR code expired. Please generate a new one.")
        stopPolling()
        break

      default:
        setStatus("waiting")
        setMessage(statusResponse.message || "Waiting for mobile app...")
    }
  }

  const cleanup = () => {
    stopPolling()
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = () => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      case "waiting":
      case "scanned":
        return <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
      case "approved":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case "rejected":
      case "expired":
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "unavailable":
        return <Smartphone className="h-6 w-6 text-emerald-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "generating":
        return "text-blue-600"
      case "waiting":
      case "scanned":
        return "text-yellow-600"
      case "approved":
        return "text-green-600"
      case "rejected":
      case "expired":
      case "error":
        return "text-red-600"
      case "unavailable":
        return "text-emerald-700"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* QR Code Display */}
      <div className="relative">
        <QRCodeDisplay qrData={qrData} size={256} />
        
        {/* Overlay when generating, expired or unavailable */}
        {(status === "generating" || status === "expired" || status === "unavailable") && (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
            {status === "generating" && (
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            )}
            {status === "expired" && (
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            )}
            {status === "unavailable" && (
              <div className="text-center px-4">
                <Smartphone className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">QR login unavailable</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <p className={`font-medium ${getStatusColor()}`}>{message}</p>
        </div>

        {/* Countdown */}
        {status === "waiting" && countdown > 0 && (
          <p className="text-sm text-gray-500">
            Expires in: {formatTime(countdown)}
          </p>
        )}
      </div>

      {/* Instructions */}
      {status === "waiting" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-blue-800 text-center">
            <strong>Instructions:</strong>
            <br />
            1. Open QuickChat on your mobile device
            <br />
            2. Go to Settings → Link a Device
            <br />
            3. Scan this QR code
            <br />
            4. Approve the login on your mobile
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3">
        {(status === "expired" || status === "rejected" || status === "error") && (
          <Button
            onClick={generateQRCode}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New QR Code
          </Button>
        )}

        {/* Offer phone login whenever QR can't be used */}
        {(status === "unavailable" || status === "error") && onUsePhone && (
          <Button
            onClick={onUsePhone}
            variant={status === "unavailable" ? "default" : "outline"}
            className={
              status === "unavailable"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Sign in with phone number
          </Button>
        )}
      </div>
    </div>
  )
}

