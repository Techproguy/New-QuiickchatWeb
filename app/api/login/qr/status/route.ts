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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
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

    const response: Record<string, unknown> = { status: tokenData.status }

    if (tokenData.status === "confirmed" && tokenData.webJwt) {
      response.webJwt = tokenData.webJwt
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error checking QR status:", error)
    return NextResponse.json({ error: "Failed to check QR status" }, { status: 500 })
  }
}
