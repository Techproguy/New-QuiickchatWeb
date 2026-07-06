"use client"

import { useEffect, useCallback, useMemo } from "react"
import { X, Download, ExternalLink, Music } from "lucide-react"

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i
const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v|ogg)(\?|$)/i
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i

function inferMediaType(type: string, url: string): "image" | "video" | "audio" | "file" {
  const t = (type || "").toLowerCase()
  if (["image", "photo"].includes(t)) return "image"
  if (t === "video") return "video"
  if (["audio", "voice", "voice_note"].includes(t)) return "audio"
  if (url.startsWith("data:image/")) return "image"
  if (url.startsWith("data:video/")) return "video"
  if (url.startsWith("data:audio/")) return "audio"
  const path = url.split("?")[0].toLowerCase()
  if (IMAGE_EXT.test(path)) return "image"
  if (VIDEO_EXT.test(path)) return "video"
  if (AUDIO_EXT.test(path)) return "audio"
  return "file"
}

interface MediaViewerProps {
  type: "image" | "video" | "audio" | "file"
  url: string
  fileName?: string
  onClose: () => void
}

export function MediaViewer({ type, url, fileName, onClose }: MediaViewerProps) {
  const displayType = useMemo(() => inferMediaType(type, url), [type, url])
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "download"
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media content */}
        <div className="flex max-h-[85vh] max-w-full items-center justify-center overflow-auto rounded-lg">
          {displayType === "image" && (
            <img
              src={url}
              alt=""
              className="max-h-[85vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {displayType === "video" && (
            <video
              src={url}
              controls
              autoPlay
              className="max-h-[85vh] max-w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {displayType === "audio" && (
            <div
              className="flex flex-col items-center gap-6 rounded-2xl bg-white/10 px-10 py-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/20">
                <Music className="h-10 w-10 text-white" aria-hidden />
              </div>
              <audio
                src={url}
                controls
                autoPlay
                className="h-12 w-full max-w-md [&::-webkit-media-controls-panel]:bg-white/10"
              />
            </div>
          )}
          {displayType === "file" && (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-white/10 p-8 text-white">
              <p className="text-sm text-white/70">This file cannot be previewed in-app</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 hover:bg-white/30"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
