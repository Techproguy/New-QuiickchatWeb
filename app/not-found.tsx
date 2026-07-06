import Link from "next/link"

// Not using "use client" to allow SSR/prerendering without React Context issues
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
