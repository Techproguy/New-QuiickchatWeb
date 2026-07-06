"use client"

import { ArrowLeft, HelpCircle, Book, MessageCircle, ChevronRight, FileText, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

const helpSections = [
  {
    title: "Frequently Asked Questions",
    icon: HelpCircle,
    items: [
      { title: "How to get started", description: "Learn the basics of using the app" },
      { title: "Account settings", description: "Manage your account preferences" },
      { title: "Privacy and security", description: "Keep your account secure" },
      { title: "Troubleshooting", description: "Common issues and solutions" },
    ],
  },
  {
    title: "Help Topics",
    icon: Book,
    items: [
      { title: "Messaging", description: "Send and receive messages" },
      { title: "Calls", description: "Make voice and video calls" },
      { title: "Groups", description: "Create and manage groups" },
      { title: "Settings", description: "Customize your experience" },
    ],
  },
]

const supportOptions = [
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: MessageCircle,
    action: "contact",
  },
  {
    title: "Privacy Policy",
    description: "Read our privacy policy",
    icon: Shield,
    action: "privacy",
  },
  {
    title: "Terms of Service",
    description: "View terms and conditions",
    icon: FileText,
    action: "terms",
  },
]

export function HelpSettings() {
  const router = useRouter()

  const handleAction = (action: string) => {
    switch (action) {
      case "contact":
        // Open contact support modal or page
        console.log("Contact support")
        break
      case "privacy":
        // Navigate to privacy policy
        console.log("Privacy policy")
        break
      case "terms":
        // Navigate to terms of service
        console.log("Terms of service")
        break
      default:
        break
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-neutral-200">
        <button
          onClick={() => router.push("/settings")}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700" />
        </button>
        <h2 className="text-xl font-semibold text-neutral-900">Help</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto py-6 px-4 md:px-6">
          {/* Help Sections */}
          {helpSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-neutral-600" />
                  <p className="text-[13px] font-medium text-neutral-500 uppercase">{section.title}</p>
                </div>
              </div>
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    itemIndex !== section.items.length - 1 ? "border-b border-neutral-200" : ""
                  } hover:bg-neutral-50 transition-colors cursor-pointer`}
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-normal text-neutral-900">{item.title}</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400" />
                </div>
              ))}
            </div>
          ))}

          {/* Support Options */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <p className="text-[13px] font-medium text-neutral-500 uppercase">Support & Legal</p>
            </div>
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  index !== supportOptions.length - 1 ? "border-b border-neutral-200" : ""
                } hover:bg-neutral-50 transition-colors cursor-pointer`}
                onClick={() => handleAction(option.action)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <option.icon className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-normal text-neutral-900">{option.title}</p>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </div>
            ))}
          </div>

          {/* App Version */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-normal text-neutral-900">App Version</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">Version 1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

