'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { session } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', message }
  const [loading, setLoading] = useState(false)

  // Already signed in? Send them to the dashboard.
  useEffect(() => {
    if (session) router.replace('/')
  }, [session, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    setLoading(true)

    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    // When email confirmation is enabled, sign-up returns no session yet.
    if (mode === 'signup' && !data.session) {
      setStatus({
        type: 'success',
        message: 'Account created — check your email to confirm, then sign in.',
      })
      setMode('signin')
      return
    }

    router.replace('/')
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold tracking-tight">💰 BillBuddy</p>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        {status && (
          <p
            className={`text-sm ${
              status.type === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {status.message}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
          setStatus(null)
        }}
        className="mt-4 text-center text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        {mode === 'signin'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </main>
  )
}
