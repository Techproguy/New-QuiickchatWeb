import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const deviceFingerprint = request.headers.get("X-Device-Fingerprint") || 
                             body.device_fingerprint || 
                             `web_${Date.now()}`

    // Forward request to backend API
    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.QR_GENERATE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Fingerprint": deviceFingerprint,
      },
      body: JSON.stringify({
        session_type: "login",
        device_fingerprint: deviceFingerprint,
        ...body,
      }),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: "Backend error" }))
      return NextResponse.json(
        { error: errorData.message || "Failed to generate QR code" },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("QR generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate QR code. Ensure the backend is running and reachable." },
      { status: 500 }
    )
  }
}
