"use client"

interface RouterGuardProps {
  children: React.ReactNode
}

/**
 * Pass-through wrapper. The Next.js layout router is part of `children`;
 * delaying children prevented it from mounting and caused "invariant expected
 * layout router to be mounted". Render children immediately so the router mounts.
 */
export function RouterGuard({ children }: RouterGuardProps) {
  return <>{children}</>
}

