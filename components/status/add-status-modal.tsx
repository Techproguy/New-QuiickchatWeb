"use client"

import { useState, useRef } from "react"
import { X, Image, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { activityService } from "@/lib/activity-service"

interface AddStatusModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddStatusModal({ open, onClose, onSuccess }: AddStatusModalProps) {
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && !file) return
    setError(null)
    setSubmitting(true)
    try {
      await activityService.createStatusUpdate(caption.trim() || " ", file ?? undefined)
      setCaption("")
      setFile(null)
      onSuccess()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add status")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f ?? null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Add status</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100" aria-label="Close">
            <X className="h-5 w-5 text-neutral-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Caption (optional)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={3}
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Photo or video (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4 mr-2" />
              {file ? file.name : "Choose image or video"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting || (!caption.trim() && !file)}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
