"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { RecentSidebar } from "@/components/recent/recent-sidebar"
import { StatusViewer } from "@/components/status/status-viewer"
import { Circle } from "lucide-react"
import type { StatusUpdate } from "@/lib/activity-service"

export default function RecentPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<StatusUpdate | null>(null)

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
    <AppLayout
        activeTab="recent"
        sidebarContent={
          <RecentSidebar
            onSelectStatus={(id, status) => {
              setSelectedStatusId(id)
              setSelectedStatus(status ?? null)
            }}
          />
        }
      >
      {selectedStatusId ? (
        <StatusViewer
          statusId={selectedStatusId}
          onClose={() => {
            setSelectedStatusId(null)
            setSelectedStatus(null)
          }}
          initialStatus={selectedStatus ?? undefined}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-neutral-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200">
              <Circle className="h-12 w-12 text-neutral-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-neutral-900">Select a status to view</h3>
            <p className="text-neutral-600">Choose from your contacts&apos; status updates</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
