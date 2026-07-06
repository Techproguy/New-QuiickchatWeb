"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, MessageCircle, Phone, Loader2, Plus, Circle } from "lucide-react"
import { AddStatusModal } from "@/components/status/add-status-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { activityService, type Activity, type StatusUpdate } from "@/lib/activity-service"
import { userService, type UserProfile } from "@/lib/user-service"
import { formatDistanceToNow } from "date-fns"

interface RecentSidebarProps {
  onSelectStatus?: (statusId: string, status?: StatusUpdate) => void
}

export function RecentSidebar({ onSelectStatus }: RecentSidebarProps) {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [myStatus, setMyStatus] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [addStatusOpen, setAddStatusOpen] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadStatusUpdates()
      // Refresh status periodically
      const interval = setInterval(loadStatusUpdates, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [userProfile])

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getProfile()
      setUserProfile(profile)
    } catch (error: any) {
      // Only log if it's not a backend unavailable error
      if (error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to load user profile:", error)
      }
      // No demo/fallback data: leave userProfile null when backend is unavailable
    }
  }

  const loadStatusUpdates = async () => {
    try {
      setLoading(true)
      const [allStatus, myStatusList] = await Promise.all([
        activityService.getStatusUpdates(),
        userProfile ? activityService.getMyStatusUpdates(userProfile) : Promise.resolve([]),
      ])
      setStatusUpdates(allStatus)
      setMyStatus(myStatusList)
    } catch (error) {
      console.error("Failed to load status updates:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return timestamp
    }
  }, [])

  // Group status by user - memoized
  const statusByUser = useMemo(() => {
    return statusUpdates.reduce((acc, status) => {
      if (!acc[status.userId]) {
        acc[status.userId] = []
      }
      acc[status.userId].push(status)
      return acc
    }, {} as Record<string, StatusUpdate[]>)
  }, [statusUpdates])

  const hasUnviewedStatus = useCallback((statuses: StatusUpdate[]) => {
    return statuses.some((s) => !s.viewedBy?.includes(userProfile?.id || ""))
  }, [userProfile?.id])

  const filteredStatusUsers = useMemo(() => {
    const q = (searchQuery || '').toLowerCase()
    return Object.entries(statusByUser).filter(([, statuses]) => {
      const latestStatus = statuses[0]
      const userName = latestStatus?.userName ?? latestStatus?.user_name ?? ''
      return (userName || '').toLowerCase().includes(q)
    })
  }, [statusByUser, searchQuery])

  const handleStatusClick = useCallback((statusId: string, status?: StatusUpdate) => {
    if (onSelectStatus) {
      onSelectStatus(statusId, status)
    }
  }, [onSelectStatus])

  return (
    <section className="flex h-full flex-col bg-white">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
        <h2 className="text-center text-[22px] font-semibold text-emerald-600 mb-4">Recent</h2>

        {/* Search pill */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            aria-label="Search"
            placeholder="Search status"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-neutral-300 bg-neutral-50 px-10 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* My Status */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <button
          type="button"
          onClick={() => setAddStatusOpen(true)}
          className="flex w-full items-center gap-3 text-left rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
        >
          <div className="relative shrink-0">
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
          <div className="flex-1 min-w-0">
            <p className="font-medium text-black">My Status</p>
            <p className="text-sm text-gray-500">
              {myStatus.length > 0 ? `${myStatus.length} update${myStatus.length > 1 ? "s" : ""}` : "Tap to add status update"}
            </p>
          </div>
        </button>
      </div>

      <AddStatusModal
        open={addStatusOpen}
        onClose={() => setAddStatusOpen(false)}
        onSuccess={loadStatusUpdates}
      />

      {/* Status List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredStatusUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Circle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No status updates</p>
            <p className="text-sm text-gray-500 mt-2">Status updates from your contacts will appear here</p>
          </div>
        ) : (
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">Recent Updates</p>
            {filteredStatusUsers.map(([userId, statuses]) => {
              const latestStatus = statuses[0]
              const hasUnviewed = hasUnviewedStatus(statuses)
              return (
                <div
                  key={userId}
                  onClick={() => handleStatusClick(latestStatus.id, latestStatus)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={latestStatus.userAvatar || "/placeholder-user.jpg"} alt={latestStatus.userName ?? "User"} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {(latestStatus.userName ?? latestStatus.user_name ?? "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnviewed && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black truncate">{latestStatus.userName ?? latestStatus.user_name ?? "Unknown"}</p>
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
    </section>
  )
}
