"use client"

import { useState, useEffect, useRef } from "react"
import { PhoneOff, Mic, MicOff, Video, Volume2, ChevronUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { callsService } from "@/lib/calls-service"

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

interface CallBarProps {
  callId?: string
  peerName: string
  peerAvatar?: string
  callType: "audio" | "video"
  isMuted: boolean
  onMuteChange: (muted: boolean) => void
  onExpand: () => void
  onEnd: () => void
  callActiveSince?: number | null
}

export function CallBar({
  callId,
  peerName,
  peerAvatar,
  callType,
  isMuted,
  onMuteChange,
  onExpand,
  onEnd,
  callActiveSince = null,
}: CallBarProps) {
  const [durationSeconds, setDurationSeconds] = useState(() =>
    callActiveSince ? Math.max(0, Math.floor((Date.now() - callActiveSince) / 1000)) : 0
  )

  useEffect(() => {
    if (callActiveSince == null) return
    const t = setInterval(() => {
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - callActiveSince) / 1000)))
    }, 1000)
    return () => clearInterval(t)
  }, [callActiveSince])

  const handleEnd = async () => {
    try {
      if (callId) await callsService.endCall(callId).catch(() => {})
    } finally {
      onEnd()
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] flex h-14 items-center gap-3 bg-neutral-900 px-3 text-white shadow-lg">
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-1 min-w-0 items-center gap-3 rounded-lg py-1.5 pr-2 active:bg-white/10"
      >
        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-emerald-500/50">
          <AvatarImage src={peerAvatar} alt={peerName} />
          <AvatarFallback className="bg-emerald-600 text-sm">
            {peerName.slice(0, 2).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{peerName}</p>
          <p className="text-xs text-white/70">{formatDuration(durationSeconds)}</p>
        </div>
        <ChevronUp className="h-5 w-5 shrink-0 text-white/70" />
      </button>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className={`h-9 w-9 rounded-full text-white hover:bg-white/10 ${isMuted ? "bg-red-500/30" : ""}`}
          onClick={() => onMuteChange(!isMuted)}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-white hover:bg-white/10"
          aria-label="Speaker"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full bg-red-600 text-white hover:bg-red-700"
          onClick={handleEnd}
          aria-label="End call"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
