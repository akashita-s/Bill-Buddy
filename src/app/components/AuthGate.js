'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

// Redirects logged-out users to /login and gates rendering until the
// session has been resolved, so protected pages never flash their content.
export default function AuthGate({ children }) {
  const { session, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (!loading && !session && !isLoginPage) {
      router.replace('/login')
    }
  }, [loading, session, isLoginPage, router])

  if (loading) {
    return <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading…</div>
  }

  // Logged out and not on the login page: render nothing while redirecting.
  if (!session && !isLoginPage) return null

  return children
}
