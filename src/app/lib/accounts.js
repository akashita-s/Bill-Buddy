import { accounts } from './data'

export const accountStorageKey = 'bill-buddy-accounts'

export const accountTypes = ['Bank', 'Credit', 'Cash', 'Investment']

export const initialAccounts = accounts.map((account) => ({
  ...account,
  id: account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
}))

export function normalizeAccount(account) {
  return {
    id:
      account.id ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: account.name.trim(),
    type: account.type.trim(),
    balance: Number(account.balance),
  }
}

export function accountsTotal(accountRows) {
  return accountRows.reduce((sum, account) => sum + Number(account.balance), 0)
}
