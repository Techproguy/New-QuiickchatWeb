"use client"

import React from "react"
import { ChatProvider } from "../contexts/chat-context"
import { CallSyncProvider } from "../contexts/call-sync-context"
import { AuthRefreshOnVisible } from "./auth-refresh-on-visible"

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in Providers:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Providers wrap the app with ChatProvider. Render children directly so the
 * layout router output stays mounted (fixes "invariant expected layout router to be mounted").
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthRefreshOnVisible />
      <ChatProvider>
        <CallSyncProvider>{children}</CallSyncProvider>
      </ChatProvider>
    </ErrorBoundary>
  )
}
