"use client"

import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    setMounted(true)
    
    // Use window.location for redirect to avoid router mounting issues
    // This is a simple redirect page, so full page reload is acceptable
    const timer = setTimeout(() => {
      const authToken = localStorage.getItem("authToken")
      if (authToken) {
        window.location.href = "/chat"
      } else {
        window.location.href = "/login"
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Quiickchat</h1>
        <p className="text-gray-600">{mounted ? "Redirecting..." : "Loading..."}</p>
      </div>
    </div>
  )
}
