"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService, type AuthTokens } from "@/lib/auth-service"
import { zengoService } from "@/lib/zengo-service"

export function useAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      setIsLoading(false)

      // If not authenticated, redirect to login
      if (!authenticated) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const login = useCallback(async (tokens: AuthTokens) => {
    authService.setAuthTokens(tokens)
    setIsAuthenticated(true)
    // Register with Zego IM (Zengo) via backend for calls/chat/online status
    zengoService.registerCurrentUser().catch(() => {})
    router.push("/chat")
  }, [router])

  const logout = useCallback(() => {
    authService.clearAuth()
    setIsAuthenticated(false)
    router.push("/login")
  }, [router])

  const refreshToken = useCallback(async () => {
    try {
      const tokens = await authService.refreshAccessToken()
      authService.setAuthTokens(tokens)
      return tokens
    } catch (error) {
      console.error("Failed to refresh token:", error)
      logout()
      throw error
    }
  }, [logout])

  const resendCode = useCallback(async (phone: string) => {
    await authService.resendVerificationCode(phone)
  }, [])

  const initializeUser = useCallback(async () => {
    return await authService.initializeUser()
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    resendCode,
    initializeUser,
    getAccessToken: () => authService.getAccessToken(),
    getRefreshToken: () => authService.getRefreshToken(),
  }
}

