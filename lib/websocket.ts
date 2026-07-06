// WebSocket client for real-time features
import { API_CONFIG } from "./api-config"
import { connectionStatus } from "./connection-status"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private token: string | null = null
  private isManualDisconnect = false

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    // Check if WebSocket is supported
    if (typeof WebSocket === "undefined") {
      console.error("WebSocket is not supported in this environment")
      this.emit("connection:error", { message: "WebSocket is not supported in this browser" })
      return
    }

    if (!token) {
      console.error("Cannot connect WebSocket: No token provided")
      this.emit("connection:error", { message: "Authentication token is required" })
      return
    }

    // Skip WebSocket connection for development tokens (they won't authenticate with real backend)
    if (token.startsWith("dev_")) {
      // Silently skip - dev tokens are for local development only
      return
    }

    // Check if backend is available before attempting connection
    // Skip reconnection attempts when backend is known to be unavailable
    if (this.reconnectAttempts > 0 && !connectionStatus.isAvailable() && this.reconnectAttempts % 5 !== 0) {
      // Backend is known to be unavailable, skip most reconnection attempts
      // Only try every 5th attempt to check if backend is back
      return
    }

    this.token = token
    this.isManualDisconnect = false

    // Ensure WebSocket URL is properly formatted
    let wsUrl = API_CONFIG.WEBSOCKET.URL
    if (wsUrl.startsWith("http://")) {
      wsUrl = wsUrl.replace("http://", "ws://")
    } else if (wsUrl.startsWith("https://")) {
      wsUrl = wsUrl.replace("https://", "wss://")
    } else if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      // If no protocol, assume ws://
      wsUrl = `ws://${wsUrl}`
    }
    
    // Remove only trailing slashes from the end (but preserve path)
    // This ensures we don't have double slashes but keep the path like /ws
    wsUrl = wsUrl.replace(/\/+$/, "")
    
    // If URL doesn't have a path, add /ws as default
    try {
      const urlObj = new URL(wsUrl)
      if (urlObj.pathname === "/" || urlObj.pathname === "") {
        urlObj.pathname = "/ws"
        wsUrl = urlObj.toString()
      }
    } catch {
      // If URL parsing fails, try to add /ws manually
      if (!wsUrl.includes("/") || wsUrl.endsWith("/")) {
        wsUrl = wsUrl.replace(/\/+$/, "") + "/ws"
      }
    }
    
    // Construct URL with query parameter
    const url = new URL(wsUrl)
    url.searchParams.set("token", token)
    const fullUrl = url.toString()
    const maskedUrl = fullUrl.replace(token, "***")
    
    // Only log connection attempt if not using dev token (to reduce console noise)
    if (!token.startsWith("dev_")) {
      console.log("Connecting to WebSocket:", maskedUrl)
    }

    try {
      this.ws = new WebSocket(fullUrl)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.reconnectAttempts = 0
        // Send auth message (backend /status-updates expects { type: 'auth', token } after connect)
        if (token && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "auth", token }))
        }
        this.emit("connection:status", true)
        this.startPing()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle ping/pong
          if (data.type === "pong") {
            return
          }
          
          // Emit the event with payload
          this.emit(data.type, data.payload || data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onclose = (event) => {
        const closeReason = this.getCloseReason(event.code)
        console.log("WebSocket disconnected", {
          code: event.code,
          reason: event.reason || closeReason,
          wasClean: event.wasClean
        })
        
        this.emit("connection:status", false)
        this.stopPing()
        
        // Emit close event with details
        this.emit("connection:close", {
          code: event.code,
          reason: event.reason || closeReason,
          wasClean: event.wasClean
        })
        
        if (!this.isManualDisconnect && !event.wasClean) {
          this.attemptReconnect(token)
        }
      }

      this.ws.onerror = (error) => {
        // WebSocket error events don't provide much detail, but we can check readyState
        const state = this.ws?.readyState
        let errorMessage = "WebSocket connection error"
        
        if (state === WebSocket.CONNECTING) {
          errorMessage = "Failed to establish WebSocket connection. The backend server may be unavailable or unreachable."
        } else if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
          errorMessage = "WebSocket connection closed unexpectedly"
        }
        
        // Skip logging for development tokens (they won't authenticate)
        const isDevToken = token?.startsWith("dev_")
        
        // Don't spam console in production, only log periodically
        // And skip if using dev token (expected to fail)
        if (!isDevToken && (this.reconnectAttempts === 0 || this.reconnectAttempts % 5 === 0)) {
          console.warn("WebSocket error:", errorMessage, {
            readyState: state,
            url: maskedUrl || wsUrl,
            attempt: this.reconnectAttempts + 1,
          })
        }
        
        // Don't record failure for dev tokens (expected to fail)
        if (!isDevToken) {
          connectionStatus.recordFailure()
        }
        
        this.emit("connection:status", false)
        this.emit("connection:error", { message: errorMessage, readyState: state })
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      if (!this.isManualDisconnect) {
        this.attemptReconnect(token)
      }
    }
  }

  disconnect() {
    this.isManualDisconnect = true
    this.stopPing()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      console.warn("WebSocket not connected, queuing message:", type)
      // Queue message for when connection is restored
      if (this.token) {
        // Try to reconnect
        this.connect(this.token)
      }
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: unknown) => void) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data))
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private attemptReconnect(token: string) {
    if (this.isManualDisconnect) return
    
    // Don't attempt reconnection with dev tokens
    if (token?.startsWith("dev_")) {
      return
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
      
      // Only log reconnection attempts periodically to reduce console noise
      if (this.reconnectAttempts === 1 || this.reconnectAttempts % 5 === 0) {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      }
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(token)
      }, delay)
    } else {
      // Only log max attempts reached if not using dev token
      if (!token?.startsWith("dev_")) {
        console.error("Max reconnection attempts reached")
      }
      this.emit("connection:status", false)
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private getCloseReason(code: number): string {
    // WebSocket close codes
    const reasons: Record<number, string> = {
      1000: "Normal closure",
      1001: "Going away",
      1002: "Protocol error",
      1003: "Unsupported data",
      1006: "Abnormal closure (no close frame)",
      1007: "Invalid data",
      1008: "Policy violation",
      1009: "Message too big",
      1010: "Extension error",
      1011: "Internal server error",
      1012: "Service restart",
      1013: "Try again later",
      1014: "Bad gateway",
      1015: "TLS handshake failure",
    }
    return reasons[code] || `Unknown close code: ${code}`
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient()
