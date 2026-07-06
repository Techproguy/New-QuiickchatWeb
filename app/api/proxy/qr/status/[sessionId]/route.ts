import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/api-config"

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params

    const backendResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.QR_STATUS}/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: "Backend error" }))
      return NextResponse.json(
        {
          status: "error",
          authenticated: false,
          message: errorData.message || "Failed to check QR status",
        },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { 
        status: "error",
        authenticated: false,
        error: "Failed to check status" 
      },
      { status: 500 }
    )
  }
}
