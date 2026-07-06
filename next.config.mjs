/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["app", "components", "lib"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blob.v0.dev",
      },
    ],
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ]
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
}

export default nextConfig
