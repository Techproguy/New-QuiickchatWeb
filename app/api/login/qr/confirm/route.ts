import { type NextRequest, NextResponse } from "next/server"

// In-memory store for QR tokens (use Redis in production)
const qrTokens = new Map<
  string,
  {
    status: "waiting" | "scanned" | "confirmed"
    createdAt: number
    userId?: string
    webJwt?: string
  }
>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, mobileAuthToken } = body

    if (!token || !mobileAuthToken) {
      return NextResponse.json({ error: "Token and mobile auth token are required" }, { status: 400 })
    }

    const tokenData = qrTokens.get(token)

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    // Check if token is expired (2 minutes)
    if (Date.now() - tokenData.createdAt > 120000) {
      qrTokens.delete(token)
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }

    // Verify mobile auth token (in production, validate against your auth system)
    // For demo purposes, we'll accept any token

    // Generate web JWT token
    const webJwt = "web_jwt_" + Math.random().toString(36).substring(2, 15)

    // Update token status
    qrTokens.set(token, {
      ...tokenData,
      status: "confirmed",
      userId: "user_123", // In production, extract from mobile auth token
      webJwt,
    })

    return NextResponse.json({
      success: true,
      message: "QR login confirmed",
    })
  } catch (error) {
    console.error("Error confirming QR login:", error)
    return NextResponse.json({ error: "Failed to confirm QR login" }, { status: 500 })
  }
}
