"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Upload, Image as ImageIcon, Palette, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { settingsService } from "@/lib/settings-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Bright wallpapers (light themes)
const brightWallpapers = [
  { id: "bright-1", gradient: "from-blue-50 to-blue-100", name: "Sky Blue" },
  { id: "bright-2", gradient: "from-green-50 to-green-100", name: "Mint" },
  { id: "bright-3", gradient: "from-purple-50 to-purple-100", name: "Lavender" },
  { id: "bright-4", gradient: "from-pink-50 to-pink-100", name: "Rose" },
  { id: "bright-5", gradient: "from-yellow-50 to-yellow-100", name: "Sunshine" },
  { id: "bright-6", gradient: "from-orange-50 to-orange-100", name: "Peach" },
  { id: "bright-7", gradient: "from-cyan-50 to-cyan-100", name: "Ocean" },
  { id: "bright-8", gradient: "from-emerald-50 to-emerald-100", name: "Emerald" },
]

// Dark wallpapers (dark themes)
const darkWallpapers = [
  { id: "dark-1", gradient: "from-gray-800 to-gray-900", name: "Dark Gray" },
  { id: "dark-2", gradient: "from-blue-900 to-blue-950", name: "Deep Blue" },
  { id: "dark-3", gradient: "from-purple-900 to-purple-950", name: "Deep Purple" },
  { id: "dark-4", gradient: "from-green-900 to-green-950", name: "Forest" },
  { id: "dark-5", gradient: "from-red-900 to-red-950", name: "Crimson" },
  { id: "dark-6", gradient: "from-indigo-900 to-indigo-950", name: "Indigo" },
  { id: "dark-7", gradient: "from-teal-900 to-teal-950", name: "Teal" },
  { id: "dark-8", gradient: "from-slate-900 to-slate-950", name: "Slate" },
]

// Solid colors
const solidColors = [
  "#ffffff",
  "#f3f4f6",
  "#e5e7eb",
  "#d1d5db",
  "#9ca3af",
  "#6b7280",
  "#4b5563",
  "#374151",
  "#1f2937",
  "#111827",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
]

export function WallpaperSettings() {
  const router = useRouter()
  const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [dimming, setDimming] = useState([0])
  const [activeTab, setActiveTab] = useState<"bright" | "dark" | "solid" | "photos">("bright")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    settingsService.getWallpaper()
      .then(({ wallpaper_url }) => {
        if (wallpaper_url) {
          const isBright = brightWallpapers.some((w) => w.id === wallpaper_url)
          const isDark = darkWallpapers.some((w) => w.id === wallpaper_url)
          const isSolid = solidColors.includes(wallpaper_url)
          if (isBright || isDark) setSelectedWallpaper(wallpaper_url)
          else if (isSolid) setSelectedColor(wallpaper_url)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const currentWallpaper = selectedWallpaper || selectedColor || "bright-1"
  const isBright = brightWallpapers.some((w) => w.id === currentWallpaper)
  const isDark = darkWallpapers.some((w) => w.id === currentWallpaper)
  const isSolid = selectedColor !== null

  const getPreviewBackground = () => {
    if (selectedColor) {
      return { backgroundColor: selectedColor }
    }
    if (selectedWallpaper) {
      const bright = brightWallpapers.find((w) => w.id === selectedWallpaper)
      const dark = darkWallpapers.find((w) => w.id === selectedWallpaper)
      if (bright) {
        return { background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }
      }
      if (dark) {
        return { background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }
      }
    }
    return {}
  }

  const handleApplyWallpaper = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (selectedWallpaper) {
        await settingsService.updateWallpaper(selectedWallpaper)
      } else if (selectedColor) {
        await settingsService.updateWallpaper(selectedColor)
      }
      
      setSuccess("Wallpaper applied successfully")
    } catch (err: any) {
      console.error("Failed to apply wallpaper:", err)
      setError(err.message || "Failed to apply wallpaper")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const result = await settingsService.uploadWallpaper(file)
      setSuccess("Wallpaper uploaded and applied successfully")
      // Optionally set the uploaded wallpaper as selected
    } catch (err: any) {
      console.error("Failed to upload wallpaper:", err)
      setError(err.message || "Failed to upload wallpaper")
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
        <h2 className="text-xl font-semibold text-neutral-900">Wallpaper</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-4xl mx-auto py-6 px-4 md:px-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          )}
          {!loading && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && success && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50">
              <AlertDescription className="text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}

          {!loading && (
          <>
          {/* Preview Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <p className="text-[13px] font-medium text-neutral-500 uppercase">Preview</p>
            </div>
            <div
              className={`w-full h-64 md:h-80 p-4 flex flex-col justify-end bg-gradient-to-br ${
                isBright
                  ? brightWallpapers.find((w) => w.id === currentWallpaper)?.gradient || "from-blue-50 to-blue-100"
                  : isDark
                    ? darkWallpapers.find((w) => w.id === currentWallpaper)?.gradient || "from-gray-800 to-gray-900"
                    : "from-blue-50 to-blue-100"
              }`}
              style={isSolid ? getPreviewBackground() : {}}
            >
              <div className="space-y-2 relative z-10">
                <div className="bg-white rounded-lg p-3 max-w-xs shadow-sm">
                  <p className="text-sm text-neutral-900">This is how your chat will look</p>
                </div>
                <div className="bg-emerald-600 text-white rounded-lg p-3 max-w-xs ml-auto shadow-sm">
                  <p className="text-sm">Your messages will appear like this</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dimming Slider */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[15px] font-normal text-neutral-900">Dim wallpaper</p>
                <span className="text-[13px] text-neutral-500">{dimming[0]}%</span>
              </div>
              <Slider
                value={dimming}
                onValueChange={setDimming}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="flex border-b border-neutral-200">
              <button
                onClick={() => setActiveTab("bright")}
                className={`flex-1 px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === "bright"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Bright
              </button>
              <button
                onClick={() => setActiveTab("dark")}
                className={`flex-1 px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === "dark"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setActiveTab("solid")}
                className={`flex-1 px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === "solid"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Solid Colors
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`flex-1 px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === "photos"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                My Photos
              </button>
            </div>

            {/* Bright Wallpapers */}
            {activeTab === "bright" && (
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {brightWallpapers.map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      onClick={() => {
                        setSelectedWallpaper(wallpaper.id)
                        setSelectedColor(null)
                      }}
                      className={`relative aspect-video rounded-lg border-2 transition-all ${
                        selectedWallpaper === wallpaper.id
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className={`w-full h-full rounded-md bg-gradient-to-br ${wallpaper.gradient}`} />
                      {selectedWallpaper === wallpaper.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                          <div className="bg-emerald-600 text-white rounded-full p-1.5">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dark Wallpapers */}
            {activeTab === "dark" && (
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {darkWallpapers.map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      onClick={() => {
                        setSelectedWallpaper(wallpaper.id)
                        setSelectedColor(null)
                      }}
                      className={`relative aspect-video rounded-lg border-2 transition-all ${
                        selectedWallpaper === wallpaper.id
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className={`w-full h-full rounded-md bg-gradient-to-br ${wallpaper.gradient}`} />
                      {selectedWallpaper === wallpaper.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                          <div className="bg-emerald-600 text-white rounded-full p-1.5">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Solid Colors */}
            {activeTab === "solid" && (
              <div className="p-4">
                <div className="grid grid-cols-8 gap-2">
                  {solidColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color)
                        setSelectedWallpaper(null)
                      }}
                      className={`aspect-square rounded-lg border-2 transition-all ${
                        selectedColor === color
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <div className="flex items-center justify-center h-full">
                          <Check className="h-3 w-3 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* My Photos */}
            {activeTab === "photos" && (
              <div className="p-4">
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-neutral-400 mb-4" />
                  <p className="text-[15px] font-medium text-neutral-900 mb-2">Upload your own wallpaper</p>
                  <p className="text-[13px] text-neutral-500 mb-4">Choose an image from your device</p>
                  <label htmlFor="wallpaper-upload">
                    <Button
                      variant="outline"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
                      disabled={saving}
                      asChild
                    >
                      <span>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Photo
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="wallpaper-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApplyWallpaper}
              disabled={saving || (!selectedWallpaper && !selectedColor)}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Wallpaper"
              )}
            </Button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
