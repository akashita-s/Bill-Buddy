import DashboardCard from './components/DashboardCard'
import { cards } from './lib/cards'
import { summary, currency } from './lib/data'

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

export default function Home() {
  const s = summary()

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Your money at a glance for June 2026.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total balance" value={currency(s.totalBalance)} accent="text-gray-900 dark:text-white" />
        <StatCard label="Income (mo.)" value={currency(s.monthlyIncome)} accent="text-green-600 dark:text-green-400" />
        <StatCard label="Expenses (mo.)" value={currency(s.monthlyExpenses)} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Net savings (mo.)" value={currency(s.savings)} accent="text-blue-600 dark:text-blue-400" />
      </div>

      <h2 className="mb-4 text-xl font-semibold">Manage</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <DashboardCard key={card.slug} {...card} />
        ))}
      </div>
    </main>
  )
}
