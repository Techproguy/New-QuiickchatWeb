"use client"

import { PhoneOff, Mic, MicOff, Video, VideoOff, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface GroupCallProps {
  onStateChange: (state: "list" | "incoming" | "active" | "group") => void
}

const participants = [
  { id: 1, name: "James Bond", avatar: "/placeholder.svg?height=80&width=80", speaking: true },
  { id: 2, name: "Sarah Connor", avatar: "/placeholder.svg?height=80&width=80", speaking: false },
  { id: 3, name: "John Doe", avatar: "/placeholder.svg?height=80&width=80", speaking: false },
  { id: 4, name: "Alice Smith", avatar: "/placeholder.svg?height=80&width=80", speaking: false },
]

export function GroupCall({ onStateChange }: GroupCallProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Group Call</h2>
          <span className="text-sm text-white/70">({participants.length} participants)</span>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4 h-full">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={`relative bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center ${
                participant.speaking ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {participant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-center">{participant.name}</p>
              {participant.speaking && (
                <div className="absolute top-2 right-2 h-3 w-3 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call Controls */}
      <div className="p-6">
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isMuted ? "destructive" : "secondary"}
            className="h-12 w-12 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="h-14 w-14 rounded-full"
            onClick={() => onStateChange("list")}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            variant={isVideoOff ? "destructive" : "secondary"}
            className="h-12 w-12 rounded-full"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
