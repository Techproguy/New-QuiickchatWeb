"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle,
  Download,
  Trash2,
  Shield,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  LogOut,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { settingsService } from "@/lib/settings-service"
import { userService } from "@/lib/user-service"
import { authService } from "@/lib/auth-service"

export function AccountSettings() {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [twoStepEnabled, setTwoStepEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadAccountSettings()
  }, [])

  const loadAccountSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const settings = await settingsService.getAccountSettings()
      setTwoStepEnabled(settings.twoStepEnabled || false)
    } catch (err: any) {
      console.error("Failed to load account settings:", err)
      setError(err.message || "Failed to load account settings")
    } finally {
      setLoading(false)
    }
  }

  const handleTwoStepToggle = async (checked: boolean) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await settingsService.updateAccountSettings({ twoStepEnabled: checked })
      setTwoStepEnabled(checked)
      setSuccess("Two-step verification updated successfully")
    } catch (err: any) {
      // Only log if it's not a backend unavailable error
      if (err.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to update two-step verification:", err)
        setError(err.message || "Failed to update two-step verification")
      } else {
        setError("Unable to connect to server. Please check your connection.")
        // Revert the toggle since update failed
        setTwoStepEnabled(!checked)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRequestDataExport = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const result = await userService.requestDataExport()
      setSuccess("Data export requested. You will receive a download link shortly.")
      // If there's a download URL, you could trigger a download here
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank")
      }
    } catch (err: any) {
      console.error("Failed to request data export:", err)
      setError(err.message || "Failed to request data export")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return

    try {
      setSaving(true)
      setError(null)
      await userService.deleteAccount()
      authService.clearAuth()
      router.push("/login")
    } catch (err: any) {
      console.error("Failed to delete account:", err)
      setError(err.message || "Failed to delete account")
      setSaving(false)
    }
  }

  const handleLogout = () => {
    authService.clearAuth()
    router.push("/login")
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
        <h2 className="text-xl font-semibold text-neutral-900">Account</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-6 px-4 md:px-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50">
              <AlertDescription className="text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Two-Step Verification */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <Shield className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-normal text-neutral-900">Two-step verification</p>
                      <p className="text-[13px] text-neutral-500 mt-0.5">
                        {twoStepEnabled ? "Enabled" : "Add an extra layer of security"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={twoStepEnabled}
                      onCheckedChange={handleTwoStepToggle}
                      disabled={saving}
                      className="data-[state=checked]:bg-emerald-600 shrink-0"
                    />
                  </div>
                </div>
              </div>

          {/* Change Number */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Smartphone className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Change number</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">Transfer your account to a new phone number</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </div>

          {/* Linked Devices */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Smartphone className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Linked devices</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">Manage devices linked to your account</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
          </div>

          {/* Request Account Info */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3.5 border-b border-neutral-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Download className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-neutral-900">Request account info</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    Download a copy of your chat history and account data
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleRequestDataExport}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Request Data Export
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-normal text-red-600">Delete my account</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    Delete your account and all associated data permanently
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="delete-confirm" className="text-[15px] font-normal text-neutral-900">
                      Type &quot;DELETE&quot; to confirm
                    </Label>
                    <Input
                      id="delete-confirm"
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText("")
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteConfirmText !== "DELETE" || saving}
                      onClick={handleDeleteAccount}
                      className="w-full sm:w-auto"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Permanently Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

              {/* Logout */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <LogOut className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-normal text-neutral-900">Log out</p>
                      <p className="text-[13px] text-neutral-500 mt-0.5">Log out from all devices</p>
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
