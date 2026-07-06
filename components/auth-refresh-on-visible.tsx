"use client"

import { useEffect } from "react"
import { authService } from "@/lib/auth-service"

/**
 * When the tab becomes visible again, refresh the access token so the session
 * doesn't expire after being in the background (e.g. 24h access token still valid).
 */
export function AuthRefreshOnVisible() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && authService.isAuthenticated()) {
        authService.autoRefreshToken().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])
  return null
}
