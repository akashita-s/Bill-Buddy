'use client'

import { useEffect, useMemo, useState } from 'react'
import { cards } from '../lib/cards'
import LiveExpenses from './LiveExpenses'
import {
  currency,
  accounts,
  transactions,
  budgets,
  income,
  goals,
} from '../lib/data'

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  )
}

function Amount({ value }) {
  const positive = value >= 0
  return (
    <span className={positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
      {positive ? '+' : '-'}
      {currency(Math.abs(value))}
    </span>
  )
}

function Bar({ value, max, danger }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-800">
      <div
        className={`h-2 rounded-full ${danger ? 'bg-red-500' : 'bg-blue-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const accountStorageKey = 'bill-buddy-accounts'

const accountTypes = ['Bank', 'Credit', 'Cash', 'Investment']

const initialAccounts = accounts.map((account) => ({
  ...account,
  id: account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
}))

const emptyAccount = {
  name: '',
  type: accountTypes[0],
  balance: '',
}

function normalizeAccount(account) {
  return {
    id:
      account.id ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: account.name.trim(),
    type: account.type.trim(),
    balance: Number(account.balance),
  }
}

function AccountFields({ value, onChange, idPrefix }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_11rem_10rem]">
      <label className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        Name
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:text-white"
          required
        />
      </label>
      <label className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        Type
        <select
          id={`${idPrefix}-type`}
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        Balance
        <input
          id={`${idPrefix}-balance`}
          type="number"
          step="0.01"
          value={value.balance}
          onChange={(event) => onChange({ ...value, balance: event.target.value })}
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:text-white"
          required
        />
      </label>
    </div>
  )
}

function EditableAccounts() {
  const [accountRows, setAccountRows] = useState(initialAccounts)
  const [storageReady, setStorageReady] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(emptyAccount)
  const [newAccount, setNewAccount] = useState(emptyAccount)

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey)
    if (!stored) {
      setStorageReady(true)
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setAccountRows(parsed.map(normalizeAccount))
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey)
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    window.localStorage.setItem(accountStorageKey, JSON.stringify(accountRows))
  }, [accountRows, storageReady])

  const totalBalance = useMemo(
    () => accountRows.reduce((sum, account) => sum + Number(account.balance), 0),
    [accountRows],
  )

  function startEdit(account) {
    setEditingId(account.id)
    setDraft({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(emptyAccount)
  }

  function saveEdit(event, id) {
    event.preventDefault()
    const nextAccount = normalizeAccount({ ...draft, id })
    if (!nextAccount.name || !nextAccount.type || Number.isNaN(nextAccount.balance)) return

    setAccountRows((prev) =>
      prev.map((account) => (account.id === id ? nextAccount : account)),
    )
    cancelEdit()
  }

  function addAccount(event) {
    event.preventDefault()
    const nextAccount = normalizeAccount(newAccount)
    if (!nextAccount.name || !nextAccount.type || Number.isNaN(nextAccount.balance)) return

    setAccountRows((prev) => [...prev, nextAccount])
    setNewAccount(emptyAccount)
  }

  function deleteAccount(id) {
    setAccountRows((prev) => prev.filter((account) => account.id !== id))
    if (editingId === id) cancelEdit()
  }

  function resetAccounts() {
    setAccountRows(initialAccounts)
    setEditingId(null)
    setDraft(emptyAccount)
    window.localStorage.removeItem(accountStorageKey)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total balance</p>
          <p className="mt-1 text-2xl font-bold">{currency(totalBalance)}</p>
        </div>
        <button
          type="button"
          onClick={resetAccounts}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Reset sample cards
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {accountRows.map((account) => (
          <Card key={account.id} className="min-h-40">
            {editingId === account.id ? (
              <form onSubmit={(event) => saveEdit(event, account.id)} className="space-y-4">
                <AccountFields value={draft} onChange={setDraft} idPrefix={`account-${account.id}`} />
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex h-full flex-col gap-6">
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{account.type}</p>
                  </div>
                  <p className={`shrink-0 text-lg font-semibold ${account.balance < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {currency(account.balance)}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(account)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAccount(account.id)}
                    className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <form
        onSubmit={addAccount}
        className="rounded-xl border border-dashed border-gray-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h2 className="text-lg font-semibold">Add account</h2>
        <div className="mt-4">
          <AccountFields value={newAccount} onChange={setNewAccount} idPrefix="new-account" />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add account
        </button>
      </form>
    </div>
  )
}

function SectionContent({ slug }) {
  switch (slug) {
    case 'accounts':
      return <EditableAccounts />

    case 'transactions':
      return (
        <>
          {/* Mobile: stacked cards so nothing gets clipped on narrow screens. */}
          <ul className="space-y-3 sm:hidden">
            {transactions.map((t, i) => (
              <li
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="shrink-0 font-semibold">
                    <Amount value={t.amount} />
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{t.date}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                    {t.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: full table. */}
          <Card className="hidden p-0 overflow-hidden sm:block">
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
                {transactions.map((t, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-neutral-800">
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{t.date}</td>
                    <td className="px-6 py-3 font-medium">{t.name}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{t.category}</td>
                    <td className="px-6 py-3 text-right font-medium">
                      <Amount value={t.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )

    case 'budgets':
      return (
        <div className="space-y-4">
          {budgets.map((b) => {
            const over = b.spent > b.limit
            return (
              <Card key={b.category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className={over ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
                    {currency(b.spent)} / {currency(b.limit)}
                  </span>
                </div>
                <Bar value={b.spent} max={b.limit} danger={over} />
                {over && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Over budget by {currency(b.spent - b.limit)}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )

    case 'expenses':
      return <LiveExpenses />

    case 'income':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {income.map((i) => (
            <Card key={i.source} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{i.source}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{i.type}</p>
              </div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {currency(i.amount)}
              </p>
            </Card>
          ))}
        </div>
      )

    case 'goals':
      return (
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = Math.round((g.saved / g.target) * 100)
            return (
              <Card key={g.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {currency(g.saved)} / {currency(g.target)} ({pct}%)
                  </span>
                </div>
                <Bar value={g.saved} max={g.target} />
              </Card>
            )
          })}
        </div>
      )

    default:
      return null
  }
}

// Shared layout for each section's page, looked up by slug.
export default function SectionPage({ slug }) {
  const card = cards.find((c) => c.slug === slug)

  return (
    <main className="mx-auto max-w-6xl px-6 py-4">
      {/* <Link
        href="/"
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to dashboard
      </Link> */}

      <header className="mt-6 mb-8 flex items-center gap-4">
        <span className="text-5xl">{card.icon}</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{card.title}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{card.description}</p>
        </div>
      </header>

      <SectionContent slug={slug} />
    </main>
  )
}
