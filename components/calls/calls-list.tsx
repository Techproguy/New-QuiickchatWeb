"use client"

import { useState, useEffect } from "react"
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed, Video, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { callsService, type Call } from "@/lib/calls-service"
import { formatDistanceToNow } from "date-fns"

interface CallsListProps {
  onStateChange: (state: "list" | "incoming" | "active" | "group") => void
}

export function CallsList({ onStateChange }: CallsListProps) {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalls()
    // Refresh calls periodically
    const interval = setInterval(loadCalls, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadCalls = async () => {
    try {
      setLoading(true)
      const fetchedCalls = await callsService.getCalls()
      setCalls(fetchedCalls)
    } catch (error) {
      console.error("Failed to load calls:", error)
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

  const getCallIcon = (call: Call) => {
    if (call.status === "missed") {
      return <PhoneMissed className="h-3 w-3 text-red-600" />
    }
    if (call.direction === "incoming") {
      return <PhoneIncoming className="h-3 w-3 text-emerald-600" />
    }
    return <PhoneCall className="h-3 w-3 text-blue-600" />
  }
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <h1 className="text-2xl font-semibold text-neutral-900">Calls</h1>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onStateChange("incoming")} className="bg-emerald-600 hover:bg-emerald-700">
            <PhoneIncoming className="h-4 w-4 mr-2" />
            Simulate Incoming
          </Button>
          <Button onClick={() => onStateChange("active")} variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Start Call
          </Button>
          <Button onClick={() => onStateChange("group")} variant="outline">
            <Video className="h-4 w-4 mr-2" />
            Group Call
          </Button>
        </div>
      </div>

      {/* Call History */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No calls found</p>
            <p className="text-sm text-gray-500 mt-2">Your call history will appear here</p>
          </div>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-4 border-b border-neutral-100 hover:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={call.userAvatar || "/placeholder.svg?height=40&width=40"} alt={call.userName} />
                  <AvatarFallback>
                    {call.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`font-medium ${call.status === "missed" ? "text-red-600" : "text-neutral-900"}`}>
                    {call.userName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    {getCallIcon(call)}
                    <span className={call.status === "missed" ? "text-red-600" : ""}>
                      {formatTimestamp(call.timestamp)}
                      {call.duration && call.status !== "missed" && ` • ${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => callsService.initiateCall(call.userId, "voice").catch(console.error)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => callsService.initiateCall(call.userId, "video").catch(console.error)}
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
