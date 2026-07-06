"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, ArrowLeft } from "lucide-react"

export default function DevLoginPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Simulate login success
    console.log("Development login successful")
    router.push("/chat")
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">Development Login</CardTitle>
          <CardDescription className="text-gray-600">Quick access for development and testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLogin} className="w-full bg-black text-white hover:bg-gray-800">
            <User className="w-4 h-4 mr-2" />
            Login as Test User
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full border-gray-300 text-black hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to QR Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
