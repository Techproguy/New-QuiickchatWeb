"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Phone, Video, PhoneIncoming, PhoneCall, PhoneMissed, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { callsService, type Call } from "@/lib/calls-service"
import { formatDistanceToNow } from "date-fns"
import { useCallSync } from "@/contexts/call-sync-context"

export function CallsSidebar() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { registerCallListRefresh, setOutgoingCall } = useCallSync()

  const loadCalls = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedCalls = await callsService.getCalls()
      setCalls(fetchedCalls)
    } catch (error) {
      console.error("Failed to load calls:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCalls()
    const interval = setInterval(loadCalls, 30000)
    return () => clearInterval(interval)
  }, [loadCalls])

  useEffect(() => {
    return registerCallListRefresh(loadCalls)
  }, [registerCallListRefresh, loadCalls])

  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return timestamp
    }
  }, [])

  const getCallTypeIcon = useCallback((call: Call) => {
    if (call.status === "missed") {
      return <PhoneMissed className="h-3.5 w-3.5 text-red-500" />
    }
    if (call.direction === "incoming") {
      return <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />
    }
    return <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
  }, [])

  const getCallTypeLabel = useCallback((call: Call) => {
    if (call.status === "missed") return "Missed"
    if (call.direction === "incoming") return "Incoming"
    return "Outgoing"
  }, [])

  const filteredCalls = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim()
    if (!q) return calls
    return calls.filter((call) => {
      const name = call.userName ?? call.userId ?? ""
      return name.toLowerCase().includes(q)
    })
  }, [calls, searchQuery])

  const handleVoiceCall = useCallback(
    async (userId: string, userName: string, userAvatar: string | undefined, e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        const call = await callsService.initiateCall(userId, "voice")
        setOutgoingCall({
          callId: call.id,
          peerName: userName || call.userName || "Unknown",
          peerAvatar: userAvatar || call.userAvatar,
          callType: "audio",
        })
      } catch (err) {
        console.error("Call failed:", err)
      }
    },
    [setOutgoingCall]
  )

  const handleVideoCall = useCallback(
    async (userId: string, userName: string, userAvatar: string | undefined, e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        const call = await callsService.initiateCall(userId, "video")
        setOutgoingCall({
          callId: call.id,
          peerName: userName || call.userName || "Unknown",
          peerAvatar: userAvatar || call.userAvatar,
          callType: "video",
        })
      } catch (err) {
        console.error("Call failed:", err)
      }
    },
    [setOutgoingCall]
  )
  return (
    <section className="flex h-full flex-col bg-white">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
        <h2 className="text-center text-[22px] font-semibold text-emerald-600 mb-4">Calls</h2>

        {/* Search pill */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            aria-label="Search"
            placeholder="Search calls"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-neutral-300 bg-neutral-50 px-10 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Call History List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No calls found</p>
            <p className="text-sm text-gray-500 mt-2">Your call history will appear here</p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div key={call.id} className="group border-b border-neutral-100 px-6 py-4 hover:bg-neutral-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={call.userAvatar || "/placeholder.svg?height=40&width=40"} alt={call.userName ?? "User"} />
                  <AvatarFallback className="text-[10px]">
                    {(call.userName ?? call.userId ?? "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-[15px] font-medium ${
                        call.status === "missed" ? "text-red-600" : "text-neutral-900"
                      }`}
                    >
                      {call.userName ?? call.userId ?? "Unknown"}
                    </p>
                    <span className="ml-2 shrink-0 text-xs text-neutral-400">{formatTimestamp(call.timestamp)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {getCallTypeIcon(call)}
                    <span className={`text-xs ${call.status === "missed" ? "text-red-600" : "text-neutral-500"}`}>
                      {getCallTypeLabel(call)}
                      {call.duration && call.status !== "missed" && ` • ${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 active:scale-95 transition-transform"
                    onClick={(e) => handleVoiceCall(call.userId, call.userName ?? "Unknown", call.userAvatar, e)}
                  >
                    <Phone className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 active:scale-95 transition-transform"
                    onClick={(e) => handleVideoCall(call.userId, call.userName ?? "Unknown", call.userAvatar, e)}
                  >
                    <Video className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
