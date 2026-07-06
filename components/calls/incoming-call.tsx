"use client"

import { useState } from "react"
import { Phone, PhoneOff, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { callsService } from "@/lib/calls-service"

interface IncomingCallProps {
  callId?: string
  callerName?: string
  callerAvatar?: string
  onStateChange: (state: "list" | "incoming" | "active" | "group") => void
}

export function IncomingCall({ callId, callerName = "Unknown", callerAvatar, onStateChange }: IncomingCallProps) {
  const [busy, setBusy] = useState(false)

  const handleReject = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (callId) await callsService.endCall(callId).catch(() => {})
    } finally {
      setBusy(false)
      onStateChange("list")
    }
  }

  const handleAnswer = async (asVideo: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      if (callId) await callsService.answerCall(callId)
      onStateChange("active")
    } catch (e) {
      console.error("Answer call failed:", e)
      onStateChange("list")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="text-center space-y-6">
        <div className="relative">
          <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
            <AvatarImage src={callerAvatar || "/placeholder.svg?height=128&width=128"} />
            <AvatarFallback className="text-2xl">{callerName.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">{callerName}</h2>
          <p className="text-neutral-600">Incoming call...</p>
        </div>

        <div className="flex gap-6">
          <Button size="lg" variant="destructive" className="h-16 w-16 rounded-full" onClick={handleReject} disabled={busy}>
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => handleAnswer(false)}
            disabled={busy}
          >
            <Phone className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full bg-transparent"
            onClick={() => handleAnswer(true)}
            disabled={busy}
          >
            <Video className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
