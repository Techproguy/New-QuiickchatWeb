"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { MessagesPane } from "@/components/figma/messages-pane"

export default function ChatPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Quiickchat</h1>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout activeTab="chats">
      <MessagesPane />
    </AppLayout>
  )
}
