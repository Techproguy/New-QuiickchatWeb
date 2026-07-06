"use client"

import { useState } from "react"
import { authService } from "@/lib/auth-service"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"

type Step = "phone" | "otp"

export function PhoneLogin() {
  const { login } = useAuth()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!phone.trim()) {
      setError("Enter your phone number")
      return
    }
    setLoading(true)
    try {
      await authService.loginWithPhone(phone.trim())
      setStep("otp")
    } catch (err: any) {
      setError(err?.message || "Failed to send code. Check your number and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!code.trim()) {
      setError("Enter the verification code")
      return
    }
    setLoading(true)
    try {
      const tokens = await authService.verifyLoginWithCode(phone.trim(), code.trim())
      login(tokens)
    } catch (err: any) {
      setError(err?.message || "Invalid code. Try again or request a new code.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep("phone")
    setCode("")
    setError("")
  }

  const handleResendCode = async () => {
    setError("")
    setLoading(true)
    try {
      await authService.resendVerificationCode(phone.trim())
      setError("")
      setCode("")
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
              autoComplete="tel"
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send verification code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-gray-600">Code sent to {phone}</p>
          <div>
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1"
              maxLength={6}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify and sign in
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Different number
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
