// Connection Status Tracker
// Tracks backend availability to avoid repeated failed requests

class ConnectionStatus {
  private isBackendAvailable: boolean = true
  private lastCheckTime: number = 0
  private checkInterval: number = 60000 // Check every minute
  public consecutiveFailures: number = 0 // Made public for WebSocket check
  private readonly maxFailures = 3 // After 3 failures, mark as unavailable

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    // If we haven't checked recently, assume available
    const timeSinceLastCheck = Date.now() - this.lastCheckTime
    if (timeSinceLastCheck > this.checkInterval) {
      // Reset after interval - backend might be back
      this.isBackendAvailable = true
      this.consecutiveFailures = 0
    }
    return this.isBackendAvailable
  }

  /**
   * Mark a request as failed
   */
  recordFailure() {
    this.consecutiveFailures++
    this.lastCheckTime = Date.now()
    
    if (this.consecutiveFailures >= this.maxFailures) {
      this.isBackendAvailable = false
      console.warn("Backend appears to be unavailable. Reducing request frequency.")
    }
  }

  /**
   * Mark a request as successful
   */
  recordSuccess() {
    if (!this.isBackendAvailable) {
      console.log("Backend connection restored.")
    }
    this.isBackendAvailable = true
    this.consecutiveFailures = 0
    this.lastCheckTime = Date.now()
  }

  /**
   * Reset connection status (force check)
   */
  reset() {
    this.isBackendAvailable = true
    this.consecutiveFailures = 0
    this.lastCheckTime = 0
  }

  /**
   * Check if we should log this error
   */
  shouldLogError(): boolean {
    // Only log errors if backend was previously available
    // or if it's the first failure
    return this.consecutiveFailures < this.maxFailures
  }
}

export const connectionStatus = new ConnectionStatus()

