"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Phone, Video, MoreHorizontal, ChevronDown, Plus, Mic, Smile, Send, CheckCheck, Check, Music, Play, File } from "lucide-react"
import { useChat } from "@/contexts/chat-context"
import { useCallSync } from "@/contexts/call-sync-context"
import { chatService } from "@/lib/chat-service"
import { callsService } from "@/lib/calls-service"
import { MediaViewer } from "@/components/chat/media-viewer"
import { useTranslations } from "@/hooks/use-translations"

type MediaViewState = { type: "image" | "video" | "audio" | "file"; url: string; fileName?: string } | null

export function MessagesPane() {
  const { t, language } = useTranslations()
  const { selectedChat, messages, sendMessage, typingUsers, onlineUsers, isConnected, startTyping } = useChat()
  const { setOutgoingCall } = useCallSync()
  const [newMessage, setNewMessage] = useState("")
  const [isTranslating, setIsTranslating] = useState<string | null>(null)
  const [mediaView, setMediaView] = useState<MediaViewState>(null)
  const [translatedByMessageId, setTranslatedByMessageId] = useState<Record<string, string>>({})
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
  const [calling, setCalling] = useState<"voice" | "video" | null>(null)
  const [callError, setCallError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close header menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false)
      }
    }
    if (headerMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [headerMenuOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat is selected; clear call error when switching chat
  useEffect(() => {
    if (selectedChat) {
      inputRef.current?.focus()
      setCallError(null)
    }
  }, [selectedChat])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    await sendMessage(messageContent)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        handleSendMessage({ preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    // Trigger typing indicator
    if (selectedChat) {
      startTyping()
    }
  }

  const handleTranslate = async (messageId: string) => {
    if (isTranslating === messageId) return
    setIsTranslating(messageId)
    try {
      const translatedText = await chatService.translateMessage(messageId, language || "en")
      if (translatedText?.trim()) {
        setTranslatedByMessageId((prev) => ({ ...prev, [messageId]: translatedText.trim() }))
      }
    } catch (error) {
      console.error("Translation failed:", error)
    } finally {
      setIsTranslating(null)
    }
  }

  const toggleTranslated = (messageId: string) => {
    setTranslatedByMessageId((prev) => {
      const next = { ...prev }
      if (next[messageId]) delete next[messageId]
      else return prev
      return next
    })
  }

  const handleVoiceCall = useCallback(async () => {
    if (!selectedChat) return
    const participantId = selectedChat.participants?.[0] ?? selectedChat.id
    if (!participantId) {
      setCallError("No participant to call")
      return
    }
    setCallError(null)
    setCalling("voice")
    try {
      const call = await callsService.initiateCall(participantId, "voice")
      setOutgoingCall({
        callId: call.id,
        peerName: selectedChat.name ?? call.userName ?? "Unknown",
        peerAvatar: selectedChat.avatar,
        callType: "audio",
      })
    } catch (e) {
      console.error("Call failed:", e)
      setCallError("Call failed. Try again.")
    } finally {
      setCalling(null)
    }
  }, [selectedChat, setOutgoingCall])

  const handleVideoCall = useCallback(async () => {
    if (!selectedChat) return
    const participantId = selectedChat.participants?.[0] ?? selectedChat.id
    if (!participantId) {
      setCallError("No participant to call")
      return
    }
    setCallError(null)
    setCalling("video")
    try {
      const call = await callsService.initiateCall(participantId, "video")
      setOutgoingCall({
        callId: call.id,
        peerName: selectedChat.name ?? call.userName ?? "Unknown",
        peerAvatar: selectedChat.avatar,
        callType: "video",
      })
    } catch (e) {
      console.error("Call failed:", e)
      setCallError("Call failed. Try again.")
    } finally {
      setCalling(null)
    }
  }, [selectedChat, setOutgoingCall])

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    } catch {
      return timestamp
    }
  }

  const formatDate = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const month = date.toLocaleString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `${hours}:${minutes} ${day}-${month}-${year}`
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
      case "sent":
        return <Check className="h-3.5 w-3.5 text-neutral-400" />
      default:
        return null
    }
  }

  const openMediaViewer = (type: "image" | "video" | "audio" | "file", url: string, fileName?: string) => {
    setMediaView({ type, url, fileName })
  }

  const renderMessageContent = (msg: { content: string; mediaUrl?: string; type?: string }) => {
    if (msg.type === "image" && msg.mediaUrl) {
      return (
        <button
          type="button"
          onClick={() => openMediaViewer("image", msg.mediaUrl!)}
          className="block cursor-pointer overflow-hidden rounded-lg text-left"
        >
          <img src={msg.mediaUrl} alt="" className="max-h-[280px] max-w-[280px] cursor-pointer object-cover hover:opacity-95" />
        </button>
      )
    }
    if (msg.type === "audio" && msg.mediaUrl) {
      return (
        <div className="flex min-w-[240px] items-center gap-3 overflow-hidden rounded-lg" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openMediaViewer("audio", msg.mediaUrl!)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            aria-label={t("play")}
          >
            <Music className="h-5 w-5" />
          </button>
          <audio src={msg.mediaUrl} controls className="h-8 flex-1 min-w-0 [&::-webkit-media-controls-panel]:bg-transparent" />
        </div>
      )
    }
    if (msg.type === "video" && msg.mediaUrl) {
      return (
        <button
          type="button"
          onClick={() => openMediaViewer("video", msg.mediaUrl!)}
          className="relative block overflow-hidden rounded-lg bg-black/30"
        >
          <video src={msg.mediaUrl} className="max-h-[200px] max-w-[280px] object-cover" muted preload="metadata" />
          <span className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-neutral-900">
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            </span>
          </span>
        </button>
      )
    }
    if (msg.type === "file" && msg.mediaUrl) {
      return (
        <button
          type="button"
          onClick={() => openMediaViewer("file", msg.mediaUrl!, msg.content)}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50"
        >
          <File className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="truncate text-sm">{msg.content || t("file")}</span>
        </button>
      )
    }
    return <p className="whitespace-pre-wrap leading-relaxed">{msg.content || t("emptyMessage")}</p>
  }

  if (!selectedChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Select a chat to start messaging</h3>
          <p className="text-neutral-600">Choose from your existing conversations</p>
        </div>
      </div>
    )
  }

  // Get typing users for this chat
  const currentTypingUsers = Array.from(typingUsers.values()).filter(
    (typing) => typing.chatId === selectedChat.id
  )

  const isOnline = onlineUsers.has(selectedChat.id) || selectedChat.isOnline

  return (
    <div className="flex h-full flex-col">
      {/* Header bar (light grey) */}
      <header className="flex h-16 items-center justify-between bg-neutral-100 px-6">
        <div>
          <div className="text-[15px] font-semibold text-neutral-900">{selectedChat.name}</div>
          <div className="text-xs flex items-center gap-1">
            {isOnline ? (
              <>
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-emerald-600">{t("online")}</span>
              </>
            ) : (
              <span className="text-neutral-500">{t("offline")}</span>
            )}
            {!isConnected && (
              <span className="text-orange-500 ml-2">• {t("reconnecting")}</span>
            )}
          </div>
        </div>

        <div className="hidden text-xs text-neutral-500 md:block">
          <div>{selectedChat.isGroup ? t("groupChat") : t("directMessage")}</div>
          <div>{t("localTime")}: {formatDate(new Date())}</div>
        </div>

        <div className="relative flex items-center gap-4" ref={menuRef}>
          <button
            type="button"
            aria-label={t("voiceCall")}
            className="text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
            onClick={handleVoiceCall}
            disabled={!!calling || selectedChat.isGroup}
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={t("videoCall")}
            className="text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
            onClick={handleVideoCall}
            disabled={!!calling || selectedChat.isGroup}
          >
            <Video className="h-5 w-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label={t("menu")}
              aria-expanded={headerMenuOpen}
              className="text-neutral-700 hover:text-neutral-900 cursor-pointer p-1 rounded hover:bg-neutral-200"
              onClick={() => setHeaderMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {headerMenuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => {
                    setHeaderMenuOpen(false)
                    // View contact / profile - could navigate to profile page if you have one
                  }}
                >
                  {t("viewContact")}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setHeaderMenuOpen(false)}
                >
                  {t("muteNotifications")}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setHeaderMenuOpen(false)}
                >
                  {t("searchInChat")}
                </button>
              </div>
            )}
          </div>
          {callError && (
            <span className="absolute -bottom-6 left-0 text-xs text-red-600" role="alert">
              {callError}
            </span>
          )}
          {calling && (
            <span className="absolute -bottom-6 left-0 text-xs text-neutral-600">
              {calling === "voice" ? t("calling") + "…" : t("videoCall") + "…"}
            </span>
          )}
        </div>
      </header>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto bg-white p-6">
        <div className="mx-auto max-w-[820px]">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">
              <p>{t("noMessages")}</p>
            </div>
          ) : (
            messages.map((msg) =>
              !msg.isOwn ? (
                <div key={msg.id} className="mb-6 flex w-full justify-start">
                  <div className={`relative max-w-[75%] rounded-2xl rounded-bl-sm bg-white text-[13px] text-neutral-900 shadow-md ring-1 ring-black/5 ${(msg.type === "image" || msg.type === "video") && msg.mediaUrl ? "overflow-hidden p-0" : "px-4 py-2"}`}>
                    {renderMessageContent(msg)}
                    {(msg.type === "text" || !msg.type) && msg.content && (
                      <>
                        {(translatedByMessageId[msg.id] ?? msg.translatedContent) && (
                          <div className="mt-2 rounded-lg bg-neutral-50 px-2 py-1.5 text-[12px] text-neutral-700 border-l-2 border-emerald-500">
                            <p className="whitespace-pre-wrap">{(translatedByMessageId[msg.id] ?? msg.translatedContent) as string}</p>
                            <button type="button" onClick={() => toggleTranslated(msg.id)} className="mt-1 text-[11px] text-emerald-600 hover:underline">{t("original")}</button>
                          </div>
                        )}
                        {!(translatedByMessageId[msg.id] ?? msg.translatedContent) && (
                          <button
                            type="button"
                            onClick={() => handleTranslate(msg.id)}
                            disabled={isTranslating === msg.id}
                            className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200"
                          >
                            {isTranslating === msg.id ? t("translating") : t("translate")} <ChevronDown className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                    <div className={`flex items-center gap-2 ${(msg.type === "image" || msg.type === "video") && msg.mediaUrl ? "absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 text-[11px] text-white" : "mt-1"}`}>
                      <span className={((msg.type === "image" || msg.type === "video") && msg.mediaUrl) ? "text-white" : "text-[11px] text-neutral-400"}>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="mb-6 flex w-full justify-end">
                  <div className={`relative max-w-[75%] rounded-2xl rounded-br-sm bg-emerald-600 text-[13px] text-white ${(msg.type === "image" || msg.type === "video") && msg.mediaUrl ? "overflow-hidden p-0" : "px-4 py-2"}`}>
                    {msg.type === "image" && msg.mediaUrl ? (
                      <>
                        <button type="button" onClick={() => openMediaViewer("image", msg.mediaUrl!)} className="block w-full cursor-pointer text-left">
                          <img src={msg.mediaUrl} alt="" className="max-h-[280px] max-w-full cursor-pointer object-cover hover:opacity-95" />
                        </button>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/30 px-2 py-0.5 text-[11px] text-white/90">
                          {formatTime(msg.timestamp)} {getMessageStatusIcon(msg.status)}
                        </div>
                      </>
                    ) : msg.type === "video" && msg.mediaUrl ? (
                      <>
                        <button type="button" onClick={() => openMediaViewer("video", msg.mediaUrl!)} className="relative block w-full cursor-pointer">
                          <video src={msg.mediaUrl} className="max-h-[200px] max-w-full object-cover" muted preload="metadata" />
                          <span className="absolute inset-0 grid place-items-center bg-black/30">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-neutral-900">
                              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                            </span>
                          </span>
                        </button>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/30 px-2 py-0.5 text-[11px] text-white/90">
                          {formatTime(msg.timestamp)} {getMessageStatusIcon(msg.status)}
                        </div>
                      </>
                    ) : msg.type === "audio" && msg.mediaUrl ? (
                      <>
                        <div className="flex min-w-[240px] items-center gap-3 px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => openMediaViewer("audio", msg.mediaUrl!)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30" aria-label={t("play")}>
                            <Music className="h-5 w-5" />
                          </button>
                          <audio src={msg.mediaUrl} controls className="h-8 flex-1 min-w-0 [&::-webkit-media-controls-panel]:bg-transparent" />
                        </div>
                        <div className="flex items-center justify-end gap-2 px-2 pb-1 text-[11px] text-white/70">
                          {formatTime(msg.timestamp)} {getMessageStatusIcon(msg.status)}
                        </div>
                      </>
                    ) : msg.type === "file" && msg.mediaUrl ? (
                      <>
                        <button type="button" onClick={() => openMediaViewer("file", msg.mediaUrl!, msg.content)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/10">
                          <File className="h-5 w-5 shrink-0 text-white/90" />
                          <span className="truncate text-sm">{msg.content || t("file")}</span>
                        </button>
                        <div className="flex items-center justify-end gap-2 px-2 pb-1 text-[11px] text-white/70">
                          {formatTime(msg.timestamp)} {getMessageStatusIcon(msg.status)}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="leading-relaxed">{msg.content || t("emptyMessage")}</p>
                        <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-white/70">
                          {formatTime(msg.timestamp)} {getMessageStatusIcon(msg.status)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ),
            )
          )}
          
          {/* Typing indicator */}
          {currentTypingUsers.length > 0 && (
            <div className="mb-6 flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-[13px] text-neutral-500 shadow-md ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span>
                    {currentTypingUsers.map(u => u.userName).join(", ")} {currentTypingUsers.length === 1 ? t("isTyping") : t("areTyping")}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-200 bg-white px-6 py-4">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-[820px] items-center gap-2">
          {/* Plus square */}
          <button
            type="button"
            aria-label={t("add")}
            className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Pill input with trailing icons */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              aria-label={t("message")}
              placeholder={`${t("message")}...`}
              className="h-11 w-full rounded-full border border-neutral-300 px-4 pr-24 text-[14px] text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
            />
            <div className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 text-neutral-600">
                <button
                  type="button"
                  aria-label={t("voice")}
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-neutral-100"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("emoji")}
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-neutral-100"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Send on the far right */}
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            aria-label={t("send")}
            className="grid h-7 w-7 place-items-center rounded-full text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {mediaView && (
        <MediaViewer
          type={mediaView.type}
          url={mediaView.url}
          fileName={mediaView.fileName}
          onClose={() => setMediaView(null)}
        />
      )}
    </div>
  )
}
