"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { wsClient } from "@/lib/websocket"
import { IncomingCall } from "@/components/calls/incoming-call"
import { ActiveCall } from "@/components/calls/active-call"
import { CallBar } from "@/components/calls/call-bar"

export type CallSyncEvent =
  | { type: "call:incoming"; call_id: string; caller_id?: string; call_type?: string }
  | { type: "call:answered"; call_id: string; call_type?: string; answered_on?: "phone" | "web" }
  | { type: "call:ended"; call_id: string; call_type?: string }

export type CallViewState = "list" | "incoming" | "active" | "group"

export interface IncomingCallInfo {
  callId: string
  callerId?: string
  callerName: string
  callerAvatar?: string
  callType?: "audio" | "video"
}

export interface ActiveCallInfo {
  callId: string
  peerName: string
  peerAvatar?: string
  callType?: "audio" | "video"
}

interface CallSyncContextType {
  lastCallEvent: CallSyncEvent | null
  clearCallEvent: () => void
  registerCallListRefresh: (cb: () => void) => () => void
  callViewState: CallViewState
  incomingCallInfo: IncomingCallInfo | null
  activeCallInfo: ActiveCallInfo | null
  callMinimized: boolean
  setCallMinimized: (v: boolean) => void
  callMuted: boolean
  setCallMuted: (v: boolean) => void
  callActiveSince: number | null
  setOutgoingCall: (info: ActiveCallInfo) => void
  setCallViewState: (state: CallViewState) => void
  setIncomingCallInfo: (info: IncomingCallInfo | null) => void
  setActiveCallInfo: (info: ActiveCallInfo | null) => void
}

const CallSyncContext = createContext<CallSyncContextType | undefined>(undefined)

export function CallSyncProvider({ children }: { children: React.ReactNode }) {
  const [lastCallEvent, setLastCallEvent] = useState<CallSyncEvent | null>(null)
  const [callViewState, setCallViewState] = useState<CallViewState>("list")
  const [incomingCallInfo, setIncomingCallInfo] = useState<IncomingCallInfo | null>(null)
  const [activeCallInfo, setActiveCallInfo] = useState<ActiveCallInfo | null>(null)
  const [callMinimized, setCallMinimized] = useState(false)
  const [callMuted, setCallMuted] = useState(false)
  const [callActiveSince, setCallActiveSince] = useState<number | null>(null)
  const refreshRef = useRef<(() => void) | null>(null)

  const registerCallListRefresh = useCallback((cb: () => void) => {
    refreshRef.current = cb
    return () => {
      refreshRef.current = null
    }
  }, [])

  const clearCallEvent = useCallback(() => setLastCallEvent(null), [])

  const setOutgoingCall = useCallback((info: ActiveCallInfo) => {
    setActiveCallInfo(info)
    setIncomingCallInfo(null)
    setCallViewState("active")
    setCallMinimized(false)
    setCallMuted(false)
    setCallActiveSince(Date.now())
  }, [])

  useEffect(() => {
    const handleCallIncoming = (data: any) => {
      const callId = data.call_id ?? data.callId
      const callerId = data.caller_id ?? data.callerId
      setLastCallEvent({
        type: "call:incoming",
        call_id: callId,
        caller_id: callerId,
        call_type: data.call_type ?? data.callType,
      })
      setIncomingCallInfo({
        callId,
        callerId,
        callerName: data.caller_name ?? data.callerName ?? "Unknown",
        callerAvatar: data.caller_avatar ?? data.callerAvatar,
        callType: data.call_type ?? data.callType ?? "audio",
      })
      setActiveCallInfo(null)
      setCallViewState("incoming")
    }

    const handleCallAnswered = (data: any) => {
      setLastCallEvent({
        type: "call:answered",
        call_id: data.call_id ?? data.callId,
        call_type: data.call_type ?? data.callType,
        answered_on: data.answered_on ?? "phone",
      })
      if (data.answered_on === "phone") {
        setCallViewState("list")
        setIncomingCallInfo(null)
        setActiveCallInfo(null)
      }
    }

    const handleCallEnded = (data: any) => {
      setLastCallEvent({
        type: "call:ended",
        call_id: data.call_id ?? data.callId,
        call_type: data.call_type ?? data.callType,
      })
      setCallViewState("list")
      setIncomingCallInfo(null)
      setActiveCallInfo(null)
      setCallMinimized(false)
      setCallMuted(false)
      setCallActiveSince(null)
      refreshRef.current?.()
    }

    wsClient.on("call:incoming", handleCallIncoming)
    wsClient.on("call:answered", handleCallAnswered)
    wsClient.on("call:ended", handleCallEnded)

    return () => {
      wsClient.off("call:incoming", handleCallIncoming)
      wsClient.off("call:answered", handleCallAnswered)
      wsClient.off("call:ended", handleCallEnded)
    }
  }, [])

  const onCallStateChange = useCallback((state: CallViewState) => {
    setCallViewState(state)
    if (state === "list") {
      setIncomingCallInfo(null)
      setActiveCallInfo(null)
    }
  }, [])

  const value: CallSyncContextType = {
    lastCallEvent,
    clearCallEvent,
    registerCallListRefresh,
    callViewState,
    incomingCallInfo,
    activeCallInfo,
    callMinimized,
    setCallMinimized,
    callMuted,
    setCallMuted,
    callActiveSince,
    setOutgoingCall,
    setCallViewState,
    setIncomingCallInfo,
    setActiveCallInfo,
  }

  const showCallBar = callViewState === "active" && activeCallInfo && callMinimized

  return (
    <CallSyncContext.Provider value={value}>
      {showCallBar && (
        <CallBar
          callId={activeCallInfo!.callId}
          peerName={activeCallInfo!.peerName}
          peerAvatar={activeCallInfo!.peerAvatar}
          callType={activeCallInfo!.callType ?? "audio"}
          isMuted={callMuted}
          onMuteChange={setCallMuted}
          onExpand={() => setCallMinimized(false)}
          onEnd={() => {
            setCallViewState("list")
            setActiveCallInfo(null)
            setCallMinimized(false)
            setCallMuted(false)
            setCallActiveSince(null)
            refreshRef.current?.()
          }}
          callActiveSince={callActiveSince}
        />
      )}
      <div className={showCallBar ? "pt-14" : ""}>
        {children}
      </div>
      {callViewState === "incoming" && incomingCallInfo && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
          <IncomingCall
            callId={incomingCallInfo.callId}
            callerName={incomingCallInfo.callerName}
            callerAvatar={incomingCallInfo.callerAvatar}
            onStateChange={(s) => {
              if (s === "active" && incomingCallInfo) {
                setActiveCallInfo({
                  callId: incomingCallInfo.callId,
                  peerName: incomingCallInfo.callerName,
                  peerAvatar: incomingCallInfo.callerAvatar,
                  callType: incomingCallInfo.callType ?? "audio",
                })
                setCallViewState("active")
              } else {
                onCallStateChange(s)
              }
            }}
          />
        </div>
      )}
      {callViewState === "active" && activeCallInfo && !callMinimized && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
          <ActiveCall
            callId={activeCallInfo.callId}
            peerName={activeCallInfo.peerName}
            peerAvatar={activeCallInfo.peerAvatar}
            callType={activeCallInfo.callType ?? "audio"}
            onStateChange={onCallStateChange}
            onMinimize={() => setCallMinimized(true)}
          />
        </div>
      )}
    </CallSyncContext.Provider>
  )
}

export function useCallSync() {
  const ctx = useContext(CallSyncContext)
  if (ctx === undefined) {
    throw new Error("useCallSync must be used within CallSyncProvider")
  }
  return ctx
}
