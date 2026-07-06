"use client"

import { useState, useEffect, useCallback } from "react"
import { settingsService } from "@/lib/settings-service"
import { getTranslation } from "@/lib/translations"

export function useTranslations() {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    settingsService
      .getLanguage()
      .then(({ language: lang }) => setLanguage(lang || "en"))
      .catch(() => {})
  }, [])

  const t = useCallback(
    (key: string) => getTranslation(language, key),
    [language]
  )

  return { t, language }
}
