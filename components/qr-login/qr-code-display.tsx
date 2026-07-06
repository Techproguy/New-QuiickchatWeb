"use client"

import { QRCodeSVG } from "qrcode.react"
import { Loader2 } from "lucide-react"

interface QRCodeDisplayProps {
  qrData: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ qrData, size = 256, className = "" }: QRCodeDisplayProps) {
  if (!qrData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // If qrData is a data URL (image from backend), display it directly
  if (qrData.startsWith("data:image")) {
    return (
      <div className={`${className}`} style={{ width: size, height: size }}>
        <img
          src={qrData}
          alt="QR Code"
          className="w-full h-full border-2 border-gray-200 rounded-lg"
          style={{ width: size, height: size }}
        />
      </div>
    )
  }

  // Otherwise, generate QR code from the data string
  // Extract the actual QR content (remove protocol if present)
  let qrValue = qrData
  if (qrData.includes("://")) {
    // If it's a URL, use it as-is
    qrValue = qrData
  } else if (qrData.includes("session_id=")) {
    // If it's already formatted, use it
    qrValue = qrData
  }

  return (
    <div
      className={`flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg p-4 ${className}`}
      style={{ width: size, height: size }}
    >
      <QRCodeSVG
        value={qrValue}
        size={size - 32} // Account for padding
        level="M"
        includeMargin={false}
        className="w-full h-full"
      />
    </div>
  )
}

