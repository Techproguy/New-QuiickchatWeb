import { NextResponse } from "next/server"

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

export async function POST() {
  try {
    // Generate a unique token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Store token with initial status
    qrTokens.set(token, {
      status: "waiting",
      createdAt: Date.now(),
    })

    // Clean up expired tokens (older than 2 minutes)
    const now = Date.now()
    for (const [key, value] of qrTokens.entries()) {
      if (now - value.createdAt > 120000) {
        // 2 minutes
        qrTokens.delete(key)
      }
    }

    return NextResponse.json({
      token,
      expiresIn: 120, // 2 minutes
    })
  } catch (error) {
    console.error("Error creating QR token:", error)
    return NextResponse.json({ error: "Failed to create QR token" }, { status: 500 })
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: "Use real backend QR flow (/api/proxy/qr/) for device linking" },
    { status: 501 }
  )
}
