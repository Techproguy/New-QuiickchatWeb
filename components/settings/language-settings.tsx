"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Globe, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { settingsService } from "@/lib/settings-service"

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
]

export function LanguageSettings() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsService.getLanguage()
      .then(({ language }) => setSelectedLanguage(language || "en"))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (code: string) => {
    if (code === selectedLanguage || saving) return
    try {
      setSaving(true)
      await settingsService.updateLanguage(code)
      setSelectedLanguage(code)
    } catch (err) {
      console.error("Failed to update language:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-neutral-200">
          <button onClick={() => router.push("/settings")} className="p-2 hover:bg-neutral-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-neutral-700" />
          </button>
          <h2 className="text-xl font-semibold text-neutral-900">Language</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
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
        <h2 className="text-xl font-semibold text-neutral-900">Language</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-6 px-4 md:px-6">
          {/* Language List */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {languages.map((language, index) => (
              <div
                key={language.code}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  index !== languages.length - 1 ? "border-b border-neutral-200" : ""
                } hover:bg-neutral-50 transition-colors cursor-pointer`}
                onClick={() => handleSelect(language.code)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <Globe className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-normal text-neutral-900">{language.name}</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{language.nativeName}</p>
                  </div>
                </div>
                {selectedLanguage === language.code && (
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            ))}
          </div>

          {/* Info Text */}
          <p className="text-[13px] text-neutral-500 mt-6 px-4 text-center">
            Changes will be applied after you restart the app
          </p>
        </div>
      </div>
    </div>
  )
}






