'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cards } from '../lib/cards'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { session, user } = useAuth()
  const { theme, mounted, toggle } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // No navbar on the login screen or before sign-in.
  if (!session) return null

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1.5 rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200" />
            <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200" />
            <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200" />
          </button>

          <Link href="/" className="text-lg font-bold tracking-tight">
            💰 BillBuddy
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="rounded-md p-1.5 text-lg leading-none transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              {/* Render the icon only after mount so SSR and client markup match. */}
              {mounted ? (theme === 'dark' ? '☀️' : '🌙') : <span className="inline-block h-5 w-5" />}
            </button>
            {user?.email && (
              <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Side drawer */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-900 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-neutral-800">
          <span className="text-lg font-bold tracking-tight">💰 MoneyWise</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-2xl leading-none text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === '/'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800'
            }`}
          >
            🏠 Overview
          </Link>
          {cards.map((card) => {
            const href = `/${card.slug}`
            const active = pathname === href
            return (
              <Link
                key={card.slug}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800'
                }`}
              >
                {card.icon} {card.title}
              </Link>
            )
          })}

          <Link
            href="/add-expense"
            onClick={() => setOpen(false)}
            className={`mt-2 rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === '/add-expense'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800'
            }`}
          >
            ➕ Add Expense
          </Link>
        </div>
      </aside>
    </>
  )
}
