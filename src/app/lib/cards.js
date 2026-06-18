// Single source of truth for the dashboard cards and their routes.
// Used by the dashboard grid and the navbar so they never drift apart.
export const cards = [
  {
    slug: 'accounts',
    title: 'Accounts',
    description: 'View balances across your bank, cash and card accounts.',
    icon: '🏦',
  },
  {
    slug: 'transactions',
    title: 'Transactions',
    description: 'Browse and search your recent money movements.',
    icon: '🔁',
  },
  {
    slug: 'budgets',
    title: 'Budgets',
    description: 'Set monthly limits and track how much is left.',
    icon: '🎯',
  },
  {
    slug: 'expenses',
    title: 'Expenses',
    description: 'See where your money goes, broken down by category.',
    icon: '💸',
  },
  {
    slug: 'income',
    title: 'Income',
    description: 'Track salary, freelance and other income sources.',
    icon: '💰',
  },
  {
    slug: 'goals',
    title: 'Goals',
    description: 'Save towards targets and watch your progress grow.',
    icon: '🚀',
  },
]
