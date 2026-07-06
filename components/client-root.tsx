"use client"

import { useEffect, useState } from "react"

/**
 * Renders children only after the component has mounted on the client.
 * This avoids "invariant expected layout router to be mounted" by ensuring
 * the Next.js layout router is mounted before we render any router-using content.
 */
export function ClientRoot({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return <>{children}</>
}
