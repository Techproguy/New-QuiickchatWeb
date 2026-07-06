"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { CallsSidebar } from "@/components/calls/calls-sidebar"
import { Phone } from "lucide-react"

export default function CallsPage() {
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
    <AppLayout activeTab="calls" sidebarContent={<CallsSidebar />}>
      <div className="flex h-full items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200">
            <Phone className="h-12 w-12 text-neutral-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-neutral-900">Select a call to view details</h3>
          <p className="text-neutral-600">Choose from your call history or start a new call</p>
        </div>
      </div>
    </AppLayout>
  )
}
