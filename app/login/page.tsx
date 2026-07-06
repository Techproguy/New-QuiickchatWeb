"use client"

import { useState } from "react"
import Image from "next/image"
import { QRLogin } from "@/components/qr-login/qr-login"
import { PhoneLogin } from "@/components/login/phone-login"
import { QrCode, Smartphone } from "lucide-react"

type LoginTab = "qr" | "phone"

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("qr")

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-6xl flex items-center justify-between gap-12">
        {/* Left side - Instructions & tabs */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <Image src="/appIcon.png" alt="Quiickchat" width={64} height={64} className="rounded-2xl" priority />
            <h1 className="text-5xl font-normal">
              <span className="text-green-500">Login into Quiickchat</span>
            </h1>
          </div>
          <p className="text-gray-700 text-lg mb-8">
            Message privately and translate into different language.
          </p>

          {/* Tabs: QR code | Phone */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setTab("qr")}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${
                tab === "qr"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <QrCode className="h-5 w-5" />
              QR code
            </button>
            <button
              type="button"
              onClick={() => setTab("phone")}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${
                tab === "phone"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Smartphone className="h-5 w-5" />
              Phone
            </button>
          </div>

          {tab === "qr" && (
            <div className="space-y-4">
              <p className="text-gray-700 text-lg font-medium">Scan with your mobile app</p>
              <ul className="space-y-2 text-gray-700">
                <li>1. Open QuickChat on your phone</li>
                <li>2. Go to Settings → Link a device</li>
                <li>3. Scan the QR code on the right</li>
                <li>4. Approve the login on your phone</li>
              </ul>
            </div>
          )}

          {tab === "phone" && (
            <div className="space-y-2">
              <p className="text-gray-700 text-lg font-medium">Sign in with phone</p>
              <p className="text-gray-600 text-sm">
                Enter your phone number. We’ll send you a verification code (same as the mobile app).
              </p>
            </div>
          )}
        </div>

        {/* Right side - QR or Phone form */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {tab === "qr" ? (
            <QRLogin />
          ) : (
            <PhoneLogin />
          )}
        </div>
      </div>
    </div>
  )
}
