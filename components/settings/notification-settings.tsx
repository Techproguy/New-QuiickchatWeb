"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MessageSquare, Users, CircleDot, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { settingsService, type NotificationSettings } from "@/lib/settings-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function NotificationSettings() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>({
    messages: true,
    groups: true,
    status: true,
    showPreview: true,
    playSoundForOutgoing: false,
    backgroundSync: false,
  })

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const notificationSettings = await settingsService.getNotificationSettings()
      setSettings(notificationSettings)
    } catch (err: any) {
      console.error("Failed to load notification settings:", err)
      setError(err.message || "Failed to load notification settings")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof NotificationSettings) => {
    try {
      setSaving(true)
      setError(null)
      const updatedSettings = { ...settings, [key]: !settings[key] }
      await settingsService.updateNotificationSettings({ [key]: updatedSettings[key] })
      setSettings(updatedSettings)
    } catch (err: any) {
      console.error("Failed to update setting:", err)
      setError(err.message || "Failed to update setting")
    } finally {
      setSaving(false)
    }
  }

  const updateCategorySetting = async (category: keyof Pick<NotificationSettings, "messages" | "groups" | "status">) => {
    try {
      setSaving(true)
      setError(null)
      const updatedSettings = { ...settings, [category]: !settings[category] }
      await settingsService.updateNotificationSettings({ [category]: updatedSettings[category] })
      setSettings(updatedSettings)
    } catch (err: any) {
      console.error("Failed to update category setting:", err)
      setError(err.message || "Failed to update category setting")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-200">
        <button
          onClick={() => router.push("/settings")}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700" />
        </button>
        <h2 className="text-xl font-semibold text-neutral-900">Notifications</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-6 px-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Category Sections */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            {/* Messages */}
            <div
              className={`flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors ${
                selectedCategory === "Messages" ? "bg-neutral-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-neutral-900">Messages</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-neutral-500">
                  {settings.messages ? "On" : "Off"}
                </span>
                <Switch
                  checked={settings.messages}
                  onCheckedChange={() => updateCategorySetting("messages")}
                  disabled={saving}
                  className="data-[state=checked]:bg-emerald-600 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Groups */}
            <div
              className={`flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors ${
                selectedCategory === "Groups" ? "bg-neutral-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Users className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-neutral-900">Groups</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-neutral-500">
                  {settings.groups ? "On" : "Off"}
                </span>
                <Switch
                  checked={settings.groups}
                  onCheckedChange={() => updateCategorySetting("groups")}
                  disabled={saving}
                  className="data-[state=checked]:bg-emerald-600 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Status */}
            <div
              className={`flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors ${
                selectedCategory === "Status" ? "bg-neutral-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <CircleDot className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-neutral-900">Status</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-neutral-500">
                  {settings.status ? "On" : "Off"}
                </span>
                <Switch
                  checked={settings.status}
                  onCheckedChange={() => updateCategorySetting("status")}
                  disabled={saving}
                  className="data-[state=checked]:bg-emerald-600 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            {/* Show previews */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200">
              <div className="flex-1 pr-4">
                <Label htmlFor="show-preview" className="text-[15px] font-normal text-neutral-900 cursor-pointer block">
                  Show previews
                </Label>
                <p className="text-[13px] text-neutral-500 mt-0.5 leading-tight">
                  Preview message text inside message notifications.
                </p>
              </div>
              <Switch
                id="show-preview"
                checked={settings.showPreview}
                onCheckedChange={() => updateSetting("showPreview")}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-600 shrink-0"
              />
            </div>

            {/* Play sound for outgoing messages */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200">
              <div className="flex-1 pr-4">
                <Label htmlFor="play-sound-outgoing" className="text-[15px] font-normal text-neutral-900 cursor-pointer block">
                  Play sound for outgoing messages
                </Label>
              </div>
              <Switch
                id="play-sound-outgoing"
                checked={settings.playSoundForOutgoing}
                onCheckedChange={() => updateSetting("playSoundForOutgoing")}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-600 shrink-0"
              />
            </div>

            {/* Background sync */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex-1 pr-4">
                <Label htmlFor="background-sync" className="text-[15px] font-normal text-neutral-900 cursor-pointer block">
                  Background sync
                </Label>
                <p className="text-[13px] text-neutral-500 mt-0.5 leading-tight">
                  Get faster performance by syncing messages in the background.
                </p>
              </div>
              <Switch
                id="background-sync"
                checked={settings.backgroundSync}
                onCheckedChange={() => updateSetting("backgroundSync")}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-600 shrink-0"
              />
            </div>
          </div>

          {/* Informational Text */}
          <p className="text-[13px] text-neutral-500 px-4 text-center">
            To get notifications, make sure they&apos;re turned on in your browser and device settings.
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
