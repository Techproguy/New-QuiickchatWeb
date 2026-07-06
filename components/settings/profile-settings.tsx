"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit2, Copy, Phone, Check, Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { userService, type UserProfile } from "@/lib/user-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ProfileSettings() {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    about: "",
    phone: "",
    avatar: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const userProfile = await userService.getProfile()
      setProfile(userProfile)
    } catch (err: any) {
      // Only log if it's not a backend unavailable error
      if (err.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to load profile:", err)
        setError(err.message || "Failed to load profile")
      } else {
        setError("Unable to connect to server. Please check your connection.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveName = async () => {
    try {
      setSaving(true)
      setError(null)
      await userService.updateProfile({ name: profile.name })
      setIsEditingName(false)
    } catch (err: any) {
      console.error("Failed to update name:", err)
      setError(err.message || "Failed to update name")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAbout = async () => {
    try {
      setSaving(true)
      setError(null)
      await userService.updateProfile({ about: profile.about })
      setIsEditingAbout(false)
    } catch (err: any) {
      console.error("Failed to update about:", err)
      setError(err.message || "Failed to update about")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      setError(null)
      const result = await userService.uploadAvatar(file)
      setProfile({ ...profile, avatar: result.avatar })
    } catch (err: any) {
      console.error("Failed to upload avatar:", err)
      setError(err.message || "Failed to upload avatar")
    } finally {
      setSaving(false)
    }
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
        <h2 className="text-xl font-semibold text-neutral-900">Profile</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-8 px-4 md:px-6">
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
              {/* Profile Picture */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <Avatar className="h-40 w-40 md:h-48 md:w-48">
                    <AvatarImage src={profile.avatar || "/placeholder.svg?height=192&width=192"} />
                    <AvatarFallback className="bg-neutral-800 text-white text-4xl md:text-5xl">
                      {profile.name
                        ? profile.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload">
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 bg-emerald-600 hover:bg-emerald-700 border-4 border-white cursor-pointer"
                      disabled={saving}
                      asChild
                    >
                      <span>
                        <Camera className="h-5 w-5 text-white" />
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={saving}
                  />
                </div>
              </div>

          {/* Name Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-4">
            <div className="px-4 py-3.5 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[13px] text-neutral-500 mb-1">Name</p>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="flex-1 text-[15px] font-normal text-neutral-900"
                        autoFocus
                        disabled={saving}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveName()
                          }
                          if (e.key === "Escape") {
                            setIsEditingName(false)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-normal text-neutral-900">{profile.name}</p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-neutral-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-4">
            <div className="px-4 py-3.5 border-b border-neutral-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[13px] text-neutral-500 mb-1">About</p>
                  {isEditingAbout ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={profile.about}
                        onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                        className="text-[15px] font-normal text-neutral-900 min-h-[80px] resize-none"
                        autoFocus
                        onBlur={handleSaveAbout}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsEditingAbout(false)
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveAbout}
                        className="bg-emerald-600 hover:bg-emerald-700 w-fit"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-[15px] font-normal text-neutral-900 break-words flex-1 pr-2">
                        {profile.about}
                      </p>
                      <button
                        onClick={() => setIsEditingAbout(true)}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors shrink-0 mt-1"
                      >
                        <Edit2 className="h-4 w-4 text-neutral-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[13px] text-neutral-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-neutral-600" />
                    <p className="text-[15px] font-normal text-neutral-900">{profile.phone || "Not set"}</p>
                  </div>
                </div>
                {profile.phone && (
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-neutral-100 rounded transition-colors"
                    title="Copy phone number"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-neutral-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
