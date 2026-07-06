"use client"

import { useState, useEffect, useRef } from "react"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, PictureInPicture2, Minimize2, Monitor, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { callsService } from "@/lib/calls-service"
import { useCallSync } from "@/contexts/call-sync-context"

const CONNECTING_SECONDS = 3

interface ActiveCallProps {
  callId?: string
  peerName?: string
  peerAvatar?: string
  callType?: "audio" | "video"
  onStateChange: (state: "list" | "incoming" | "active" | "group") => void
  onMinimize?: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ActiveCall({ callId, peerName = "Unknown", peerAvatar, callType = "audio", onStateChange, onMinimize }: ActiveCallProps) {
  const { callMuted, setCallMuted, callActiveSince } = useCallSync()
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [ending, setEnding] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [pipSupported, setPipSupported] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const isVideoCall = callType === "video"

  useEffect(() => {
    setPipSupported(typeof document !== "undefined" && !!document.pictureInPictureEnabled)
  }, [])

  useEffect(() => {
    if (!isVideoCall) return
    let stream: MediaStream | null = null
    const startCamera = async () => {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setVideoError("Camera not supported in this browser")
        return
      }
      if (!window.isSecureContext) {
        setVideoError("Camera and microphone require HTTPS. Open this site via https:// or localhost.")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        cameraStreamRef.current = stream
        setVideoError(null)
      } catch (firstErr: unknown) {
        const err = firstErr as DOMException & { name?: string; message?: string }
        const name = err?.name ?? ""
        const msg = (err?.message ?? "").toLowerCase()
        if (name === "NotAllowedError" || name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            setLocalStream(stream)
            cameraStreamRef.current = stream
            setVideoError("Microphone not available. Video only.")
          } catch {
            if (name === "NotAllowedError" || msg.includes("permission")) {
              setVideoError("Permission denied. Please allow camera (and microphone) in your browser and try again.")
            } else if (name === "NotFoundError") {
              setVideoError("No camera or microphone found.")
            } else if (name === "NotReadableError" || msg.includes("in use")) {
              setVideoError("Camera or microphone is in use by another app. Close it and try again.")
            } else if (name === "OverconstrainedError") {
              setVideoError("Camera or microphone doesn't meet requirements. Try another device.")
            } else {
              setVideoError("Could not access camera. Check browser permissions and try again.")
            }
          }
        } else if (name === "SecurityError" || msg.includes("secure")) {
          setVideoError("Camera and microphone require HTTPS. Open this site via https:// or localhost.")
        } else {
          setVideoError("Could not access camera or microphone. Check browser permissions and try again.")
        }
      }
    }
    startCamera()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
      cameraStreamRef.current = null
      setScreenStream(null)
    }
  }, [isVideoCall])

  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return
    const src = screenStream ?? localStream
    video.srcObject = src
  }, [localStream, screenStream])

  // Picture-in-Picture: when user minimizes or switches tab, show call in a small floating window (desktop/mobile)
  useEffect(() => {
    if (!isVideoCall || !localStream || typeof document === "undefined" || !document.pictureInPictureEnabled) return
    const video = localVideoRef.current
    if (!video) return

    const enterPiP = async () => {
      try {
        if (document.pictureInPictureElement) return
        await video.requestPictureInPicture()
        setIsPiPActive(true)
      } catch {
        // PiP not allowed (e.g. no user gesture) or unsupported
      }
    }

    const exitPiP = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        }
        setIsPiPActive(false)
      } catch {
        setIsPiPActive(false)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        enterPiP()
      } else {
        exitPiP()
      }
    }

    const handlePiPChange = () => {
      setIsPiPActive(!!document.pictureInPictureElement)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("enterpictureinpicture", handlePiPChange)
    document.addEventListener("leavepictureinpicture", handlePiPChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("enterpictureinpicture", handlePiPChange)
      document.removeEventListener("leavepictureinpicture", handlePiPChange)
      exitPiP()
    }
  }, [isVideoCall, localStream])

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      if (callActiveSince != null) {
        const elapsed = Math.floor((now - callActiveSince) / 1000)
        setDurationSeconds(elapsed)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [callActiveSince])

  const connecting = callActiveSince != null && durationSeconds < CONNECTING_SECONDS

  const handleEndCall = async () => {
    if (ending) return
    setEnding(true)
    try {
      if (callId) await callsService.endCall(callId).catch(() => {})
    } finally {
      setEnding(false)
      onStateChange("list")
    }
  }

  const handleTogglePiP = async () => {
    const video = localVideoRef.current
    if (!video || !document.pictureInPictureEnabled) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiPActive(false)
      } else {
        await video.requestPictureInPicture()
        setIsPiPActive(true)
      }
    } catch {
      // PiP not supported or denied
    }
  }

  const handleShareScreen = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop())
      setScreenStream(null)
      return
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setVideoError("Screen sharing not supported in this browser")
      return
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const [videoTrack] = displayStream.getVideoTracks()
      videoTrack.onended = () => {
        displayStream.getTracks().forEach((t) => t.stop())
        setScreenStream(null)
      }
      setScreenStream(displayStream)
      setVideoError(null)
    } catch {
      setVideoError("Screen share cancelled or not allowed")
    }
  }

  const handleAddParticipant = () => {
    // Placeholder: multi-party calls not implemented yet; button ready for future "Add to call" flow
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen">
      {isVideoCall ? (
        <>
          {/* Video layout: full-screen remote area with local preview overlay */}
          <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 bg-black/40">
            {/* Remote / peer area (placeholder until WebRTC); show avatar when no stream */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-40 w-40 ring-4 ring-white/20">
                <AvatarImage src={peerAvatar || "/placeholder.svg?height=160&width=160"} />
                <AvatarFallback className="text-3xl bg-emerald-600">{peerName.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
            </div>
            {/* Local webcam / screen preview */}
            <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-lg overflow-hidden border-2 border-white/30 shadow-xl bg-black">
              {(screenStream ?? localStream) ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : videoError ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-red-300 p-2 text-center">
                  {videoError}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
                  {screenStream ? "Screen" : "Camera…"}
                </div>
              )}
            </div>
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold truncate">{peerName}</h2>
              <div className="flex items-center gap-2">
                {onMinimize && (
                  <button
                    type="button"
                    onClick={onMinimize}
                    className="p-2 rounded-lg text-sm bg-black/30 hover:bg-white/10"
                    title="Minimize call (show bar at top)"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </button>
                )}
                {pipSupported && (
                  <button
                    type="button"
                    onClick={handleTogglePiP}
                    className={`p-2 rounded-lg text-sm ${isPiPActive ? "bg-white/20" : "bg-black/30 hover:bg-white/10"}`}
                    title={isPiPActive ? "Exit small window" : "Show in small window (keeps call visible when you minimize)"}
                  >
                    <PictureInPicture2 className="h-5 w-5" />
                  </button>
                )}
                <p className="text-white/70 text-sm">
                  {connecting ? "Calling…" : formatDuration(durationSeconds)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Audio layout: avatar + name + duration */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <Avatar className="h-32 w-32 ring-4 ring-white/20">
            <AvatarImage src={peerAvatar || "/placeholder.svg?height=128&width=128"} />
            <AvatarFallback className="text-2xl bg-emerald-600">{peerName.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{peerName}</h2>
            <p className="text-white/70">
              {connecting ? "Calling…" : formatDuration(durationSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="p-8">
        <div className="flex justify-center gap-6">
          <Button
            size="lg"
            variant={callMuted ? "destructive" : "secondary"}
            className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
            onClick={() => setCallMuted(!callMuted)}
            aria-label={callMuted ? "Unmute" : "Mute"}
          >
            {callMuted ? <MicOff className="h-6 w-6 shrink-0" /> : <Mic className="h-6 w-6 shrink-0" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleEndCall}
            disabled={ending}
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6 shrink-0" />
          </Button>

          <Button
            size="lg"
            variant={isVideoOff ? "destructive" : "secondary"}
            className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
            onClick={() => setIsVideoOff(!isVideoOff)}
            aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6 shrink-0" /> : <Video className="h-6 w-6 shrink-0" />}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
            aria-label="Speaker"
          >
            <Volume2 className="h-6 w-6 shrink-0" />
          </Button>

          {isVideoCall && (
            <Button
              size="lg"
              variant={screenStream ? "destructive" : "secondary"}
              className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
              onClick={handleShareScreen}
              aria-label={screenStream ? "Stop sharing screen" : "Share screen"}
              title={screenStream ? "Stop sharing screen" : "Share screen"}
            >
              <Monitor className="h-6 w-6 shrink-0" />
            </Button>
          )}

          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
            onClick={handleAddParticipant}
            aria-label="Add to call"
            title="Add to call"
          >
            <UserPlus className="h-6 w-6 shrink-0" />
          </Button>

          {onMinimize && (
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-14 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20"
              onClick={onMinimize}
              aria-label="Minimize call"
              title="Minimize (show bar at top)"
            >
              <Minimize2 className="h-6 w-6 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
