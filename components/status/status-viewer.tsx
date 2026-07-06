"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Trash2, Loader2, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { activityService, type StatusUpdate } from "@/lib/activity-service"
import { userService, type UserProfile } from "@/lib/user-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StatusViewerProps {
  statusId: string
  onClose: () => void
  /** Optional initial status from the list (e.g. feed) so name/avatar show immediately like WhatsApp */
  initialStatus?: StatusUpdate | null
}

export function StatusViewer({ statusId, onClose, initialStatus }: StatusViewerProps) {
  const [status, setStatus] = useState<StatusUpdate | null>(initialStatus ?? null)
  const [loading, setLoading] = useState(!initialStatus)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)

  useEffect(() => {
    if (initialStatus?.id === statusId) {
      setStatus(initialStatus)
      setLoading(false)
    } else {
      setStatus(null)
    }
    loadStatus()
    loadCurrentUser()
  }, [statusId, initialStatus?.id])

  useEffect(() => {
    if (status && currentUser) {
      void activityService.viewStatusUpdate(status.id).catch(() => {})
    }
  }, [status, currentUser])

  const loadCurrentUser = async () => {
    try {
      const profile = await userService.getProfile()
      setCurrentUser(profile)
    } catch (error) {
      console.error("Failed to load current user:", error)
    }
  }

  const loadStatus = async () => {
    try {
      if (initialStatus?.id !== statusId) {
        setLoading(true)
      }
      // Prefer feed first so we get the same display name as the list (WhatsApp-style)
      const feed = await activityService.getStatusUpdates()
      const fromFeed = feed.find((s) => s.id === statusId)
      const foundStatus = fromFeed ?? (await activityService.getStatusById(statusId))
      if (foundStatus) {
        setStatus(foundStatus)
      }
    } catch (error) {
      console.error("Failed to load status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!status || !currentUser || status.userId !== currentUser.id) return

    try {
      await activityService.deleteStatusUpdate(status.id)
      onClose()
    } catch (error) {
      console.error("Failed to delete status:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Status not found</p>
          <Button onClick={onClose} variant="outline" className="text-white border-white">
            Close
          </Button>
        </div>
      </div>
    )
  }

  const isOwnStatus = currentUser && (status.userId === currentUser.id || status.userId === currentUser.phone)

  return (
    <div className="flex-1 bg-black relative flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={status.userAvatar || "/placeholder-user.jpg"} alt={status.userName ?? "User"} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {((status.userName ?? status.user_name ?? "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">{status.userName ?? status.user_name ?? "Unknown"}</p>
              <p className="text-xs text-gray-300">
                {new Date(status.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {status.mediaType === "image" && status.mediaUrl ? (
          <img
            src={status.mediaUrl}
            alt={status.content}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : status.mediaType === "video" && status.mediaUrl ? (
          <video
            src={status.mediaUrl}
            controls
            className="max-w-full max-h-full rounded-lg"
            autoPlay
          />
        ) : status.mediaType === "audio" && status.mediaUrl ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-lg">
              {showTranslated && translatedContent ? translatedContent : (status.content || "Audio status")}
            </p>
            {status.content && (
              <div className="flex items-center gap-2">
                {!translatedContent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/50 text-white hover:bg-white/20"
                    disabled={isTranslating}
                    onClick={async () => {
                      setIsTranslating(true)
                      setTranslatedContent(null)
                      try {
                        const t = await activityService.translateText(status.content || "", "en")
                        setTranslatedContent(t)
                        setShowTranslated(true)
                      } catch {
                        setTranslatedContent(null)
                      } finally {
                        setIsTranslating(false)
                      }
                    }}
                  >
                    {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    {isTranslating ? "Translating..." : "Translate"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:bg-white/20"
                    onClick={() => setShowTranslated(!showTranslated)}
                  >
                    {showTranslated ? "Original" : "Translated"}
                  </Button>
                )}
              </div>
            )}
            <audio src={status.mediaUrl} controls className="w-full max-w-md" />
          </div>
        ) : (
          <div className="text-center text-white max-w-md">
            <p className="text-xl mb-4">{showTranslated && translatedContent ? translatedContent : status.content}</p>
            {status.content && (
              <div className="flex justify-center gap-2 mt-2">
                {!translatedContent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/50 text-white hover:bg-white/20"
                    disabled={isTranslating}
                    onClick={async () => {
                      setIsTranslating(true)
                      setTranslatedContent(null)
                      try {
                        const t = await activityService.translateText(status.content || "", "en")
                        setTranslatedContent(t)
                        setShowTranslated(true)
                      } catch {
                        setTranslatedContent(null)
                      } finally {
                        setIsTranslating(false)
                      }
                    }}
                  >
                    {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    {isTranslating ? "Translating..." : "Translate"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:bg-white/20"
                    onClick={() => setShowTranslated(!showTranslated)}
                  >
                    {showTranslated ? "Original" : "Translated"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {status.views !== undefined && (
          <p className="text-xs text-gray-300 text-center">
            {status.views} view{status.views !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  )
}



