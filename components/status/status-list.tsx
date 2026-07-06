"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Circle } from "lucide-react"
import { activityService, type StatusUpdate } from "@/lib/activity-service"
import { userService, type UserProfile } from "@/lib/user-service"
import { formatDistanceToNow } from "date-fns"

interface StatusListProps {
  onSelectStatus: (statusId: string) => void
}

export function StatusList({ onSelectStatus }: StatusListProps) {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [myStatus, setMyStatus] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    loadStatusUpdates()
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getProfile()
      setUserProfile(profile)
    } catch (error: any) {
      // Only log if it's not a backend unavailable error
      if (error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to load user profile:", error)
      }
      // Set a default profile in development
      if (error.message === "BACKEND_UNAVAILABLE" && process.env.NODE_ENV === "development") {
        setUserProfile({
          id: "dev_user",
          name: "Development User",
          email: "dev@example.com",
          phone: "+1234567890",
        } as any)
      }
    }
  }

  const loadStatusUpdates = async () => {
    try {
      setLoading(true)
      const [allStatus, myStatusList] = await Promise.all([
        activityService.getStatusUpdates(),
        userProfile ? activityService.getUserStatusUpdates(userProfile.id) : Promise.resolve([]),
      ])
      setStatusUpdates(allStatus)
      setMyStatus(myStatusList)
    } catch (error) {
      console.error("Failed to load status updates:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  // Group status by user
  const statusByUser = statusUpdates.reduce((acc, status) => {
    if (!acc[status.userId]) {
      acc[status.userId] = []
    }
    acc[status.userId].push(status)
    return acc
  }, {} as Record<string, StatusUpdate[]>)

  const hasUnviewedStatus = (statuses: StatusUpdate[]) => {
    return statuses.some((s) => !s.viewedBy?.includes(userProfile?.id || ""))
  }

  return (
    <div className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-black">Status</h1>
      </div>

      {/* My Status */}
      <div className="border-b border-neutral-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile?.avatar || "/placeholder-user.jpg"} alt={userProfile?.name || "You"} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {userProfile?.name
                  ? userProfile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-white">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-black">My Status</p>
            <p className="text-sm text-gray-500">
              {myStatus.length > 0 ? `${myStatus.length} update${myStatus.length > 1 ? "s" : ""}` : "Tap to add status update"}
            </p>
          </div>
        </div>
      </div>

      {/* Status List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : Object.keys(statusByUser).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Circle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No status updates</p>
            <p className="text-sm text-gray-500 mt-2">Status updates from your contacts will appear here</p>
          </div>
        ) : (
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">Recent Updates</p>
            {Object.entries(statusByUser).map(([userId, statuses]) => {
              const latestStatus = statuses[0]
              const hasUnviewed = hasUnviewedStatus(statuses)
              return (
                <div
                  key={userId}
                  onClick={() => onSelectStatus(latestStatus.id)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={latestStatus.userAvatar || "/placeholder-user.jpg"} alt={latestStatus.userName} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {latestStatus.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnviewed && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black truncate">{latestStatus.userName}</p>
                    <p className="text-sm text-gray-500 truncate">{formatTimestamp(latestStatus.timestamp)}</p>
                  </div>
                  {statuses.length > 1 && (
                    <div className="text-xs text-gray-400">{statuses.length}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}



