import Link from 'next/link'
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

function SectionContent({ slug }) {
  switch (slug) {
    case 'accounts':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a.type}</p>
              </div>
              <p className={`text-lg font-semibold ${a.balance < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {currency(a.balance)}
              </p>
            </Card>
          ))}
        </div>
      )

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
