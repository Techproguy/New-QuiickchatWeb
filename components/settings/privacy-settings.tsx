"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ChevronRight, Shield, Users, Eye, MessageSquare, Clock, UserX, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { settingsService, type PrivacySettings } from "@/lib/settings-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PrivacySettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<PrivacySettings>({
    lastSeen: "everyone",
    profilePhoto: "contacts",
    about: "contacts",
    status: "contacts",
    readReceipts: true,
    disappearingMessages: "off",
    groups: "everyone",
  })

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const privacySettings = await settingsService.getPrivacySettings()
      setSettings(privacySettings)
    } catch (err: any) {
      console.error("Failed to load privacy settings:", err)
      setError(err.message || "Failed to load privacy settings")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    try {
      setSaving(true)
      setError(null)
      const updatedSettings = { ...settings, [key]: value }
      await settingsService.updatePrivacySettings({ [key]: value })
      setSettings(updatedSettings)
    } catch (err: any) {
      console.error("Failed to update privacy setting:", err)
      setError(err.message || "Failed to update privacy setting")
    } finally {
      setSaving(false)
    }
  }

  const getDisplayValue = (value: string) => {
    const map: Record<string, string> = {
      everyone: "Everyone",
      contacts: "My Contacts",
      nobody: "Nobody",
      off: "Off",
      "24h": "24 Hours",
      "7d": "7 Days",
      "90d": "90 Days",
    }
    return map[value] || value
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-neutral-200">
        <button
          onClick={() => router.push("/settings")}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700" />
        </button>
        <h2 className="text-xl font-semibold text-neutral-900">Privacy</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-6 px-4 md:px-6">
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
              {/* Who can see my personal information */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <p className="text-[13px] font-medium text-neutral-500 uppercase">Who can see my personal information</p>
            </div>

            {/* Last seen */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Clock className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Last seen</p>
                </div>
              </div>
              <Select
                value={settings.lastSeen}
                onValueChange={(value) => updateSetting("lastSeen", value)}
                disabled={saving}
              >
                <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                  <SelectValue>{getDisplayValue(settings.lastSeen)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Profile photo */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Eye className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Profile photo</p>
                </div>
              </div>
              <Select
                value={settings.profilePhoto}
                onValueChange={(value) => updateSetting("profilePhoto", value)}
                disabled={saving}
              >
                <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                  <SelectValue>{getDisplayValue(settings.profilePhoto)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* About */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Users className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">About</p>
                </div>
              </div>
              <Select
                value={settings.about}
                onValueChange={(value) => updateSetting("about", value)}
                disabled={saving}
              >
                <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                  <SelectValue>{getDisplayValue(settings.about)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Shield className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Status</p>
                </div>
              </div>
              <Select
                value={settings.status}
                onValueChange={(value) => updateSetting("status", value)}
                disabled={saving}
              >
                <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                  <SelectValue>{getDisplayValue(settings.status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Disappearing messages */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3.5 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <Clock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-normal text-neutral-900">Disappearing messages</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">
                      New messages from you will disappear after the selected duration
                    </p>
                  </div>
                </div>
                <Select
                  value={settings.disappearingMessages}
                  onValueChange={(value) => updateSetting("disappearingMessages", value)}
                  disabled={saving}
                >
                  <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                    <SelectValue>{getDisplayValue(settings.disappearingMessages)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Read receipts */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3 flex-1 pr-4">
                <div className="flex h-8 w-8 items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Read receipts</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    If turned off, you won&apos;t send or receive read receipts. Read receipts are always sent for group
                    chats.
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.readReceipts}
                onCheckedChange={(checked) => updateSetting("readReceipts", checked)}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-600 shrink-0"
              />
            </div>
          </div>

          {/* Groups */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3.5 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <Users className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-normal text-neutral-900">Groups</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">Who can add you to groups</p>
                  </div>
                </div>
                <Select
                  value={settings.groups}
                  onValueChange={(value) => updateSetting("groups", value)}
                  disabled={saving}
                >
                  <SelectTrigger className="w-32 h-8 text-[15px] border-0 focus:ring-0">
                    <SelectValue>{getDisplayValue(settings.groups)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">My Contacts</SelectItem>
                    <SelectItem value="contacts_except">My Contacts Except...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Blocked contacts */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <UserX className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Blocked contacts</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">Manage your blocked contacts list</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
