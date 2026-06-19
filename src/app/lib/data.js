// Sample finance data for the money-management UI.
// Swap these out for a real data source (API / DB) later.

export const currency = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'INR' })

export const accounts = [
  { name: 'Everyday Checking', type: 'Bank', balance: 4820.55 },
  { name: 'High-Yield Savings', type: 'Bank', balance: 15230.0 },
  { name: 'Visa Credit Card', type: 'Credit', balance: -1240.18 },
  { name: 'Cash Wallet', type: 'Cash', balance: 180.0 },
]

export const transactions = [
  { date: '2026-06-17', name: 'Whole Foods Market', category: 'Groceries', amount: -86.42 },
  { date: '2026-06-16', name: 'Monthly Salary', category: 'Income', amount: 4200.0 },
  { date: '2026-06-15', name: 'Netflix', category: 'Subscriptions', amount: -15.99 },
  { date: '2026-06-14', name: 'Shell Gas Station', category: 'Transport', amount: -52.3 },
  { date: '2026-06-13', name: 'Freelance Project', category: 'Income', amount: 650.0 },
  { date: '2026-06-12', name: 'Rent', category: 'Housing', amount: -1500.0 },
  { date: '2026-06-11', name: 'Coffee Shop', category: 'Dining', amount: -6.75 },
]

export const budgets = [
  { category: 'Groceries', limit: 600, spent: 420 },
  { category: 'Dining', limit: 250, spent: 190 },
  { category: 'Transport', limit: 200, spent: 145 },
  { category: 'Subscriptions', limit: 100, spent: 62 },
  { category: 'Entertainment', limit: 150, spent: 175 },
]

export const expenses = [
  { category: 'Housing', amount: 1500 },
  { category: 'Groceries', amount: 420 },
  { category: 'Transport', amount: 145 },
  { category: 'Dining', amount: 190 },
  { category: 'Subscriptions', amount: 62 },
  { category: 'Entertainment', amount: 175 },
]

export const income = [
  { source: 'Monthly Salary', type: 'Employment', amount: 100000 },
  // { source: 'Freelance Project', type: 'Self-employed', amount: 650 },
  { source: 'Dividends', type: 'Investments', amount: 85 },
]

export const goals = [
  { name: 'Emergency Fund', target: 1000000, saved: 500000 },
  { name: 'Vacation to Europe', target: 600000, saved: 600000 },
  { name: 'New Car', target: 2000000, saved: 2000 },
]

// Derived top-line numbers for the dashboard summary banner.
export const summary = () => {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthlyIncome = income.reduce((s, i) => s + i.amount, 0)
  const monthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savings: monthlyIncome - monthlyExpenses,
  }
}
