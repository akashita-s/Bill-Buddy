'use client'

import { useRouter } from 'next/navigation'

// A card that navigates to its page using the router (per requirement).
export default function DashboardCard({ slug, title, description, icon }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/${slug}`)}
      className="group flex flex-col items-start rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <span className="mb-4 text-4xl">{icon}</span>
      <h2 className="mb-2 flex items-center text-xl font-semibold">
        {title}
        <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  )
}
