'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { currency } from '../lib/data'

const CATEGORIES = [
  'Housing',
  'Groceries',
  'Transport',
  'Dining',
  'Subscriptions',
  'Entertainment',
  'Other',
  'Food & Drinks',
  'Health & Fitness',
  'Gift'
]

export default function AddExpensePage() {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: CATEGORIES[0],
    date: today,
  })
  const [expenses, setExpenses] = useState([])
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', message }
  const [loading, setLoading] = useState(false)

  // Load existing rows so the user can confirm the insert worked.
  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .limit(20)

    if (error) {
      setStatus({ type: 'error', message: `Could not load expenses: ${error.message}` })
      return
    }
    setExpenses(data ?? [])
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    const amount = parseFloat(form.amount)
    if (!form.description.trim()) {
      setStatus({ type: 'error', message: 'Please enter a description.' })
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount greater than 0.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.from('expenses').insert({
      title: form.description.trim(), // 'title' is the NOT NULL column on the table
      amount,
      category: form.category,
      date: form.date,
      user_id: user.id, // satisfies the per-user RLS check (auth.uid() = user_id)
    })
    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: `Failed to save: ${error.message}` })
      return
    }

    setStatus({ type: 'success', message: 'Expense saved!' })
    setForm({ description: '', amount: '', category: CATEGORIES[0], date: today })
    loadExpenses()
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-4">
      {/* <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to dashboard
      </Link> */}

      <header className="mt-6 mb-8 flex items-center gap-4">
        <span className="text-5xl">➕</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Record a new expense — it&apos;s saved to your database.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="e.g. Whole Foods Market"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Amount (INR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Add expense'}
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

      <h2 className="mb-3 mt-10 text-xl font-semibold">Recent expenses</h2>
      {expenses.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No expenses yet — add one above.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards so the amount never gets clipped. */}
          <ul className="space-y-3 sm:hidden">
            {expenses.map((x) => (
              <li
                key={x.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{x.title}</p>
                  <p className="shrink-0 font-semibold text-red-600 dark:text-red-400">
                    {currency(Number(x.amount))}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{x.date ? String(x.date).slice(0, 10) : '—'}</span>
                  {x.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                      {x.category}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: full table. */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 dark:bg-neutral-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((x) => (
                  <tr key={x.id} className="border-t border-gray-100 dark:border-neutral-800">
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                      {x.date ? String(x.date).slice(0, 10) : '—'}
                    </td>
                    <td className="px-6 py-3 font-medium">{x.title}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{x.category}</td>
                    <td className="px-6 py-3 text-right font-medium text-red-600 dark:text-red-400">
                      {currency(Number(x.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
