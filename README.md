# BillBuddy

BillBuddy is a personal finance dashboard built with Next.js and Tailwind CSS. It helps you view your financial summary, track income and expenses, manage budgets, and stay on top of savings goals.

## Features

- Overview dashboard with total balance, monthly income, expenses, and net savings
- Quick access to accounts, expenses, budgets, income, goals, and transactions
- Add new expenses from the app UI
- Theme toggle for light/dark mode
- Supabase-powered authentication and session management
- Responsive layout built with Tailwind CSS

## Tech stack

- Next.js 13.5 (App Router)
- React 18
- Tailwind CSS
- Supabase client for authentication

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

For production:

```bash
npm run build
npm run start
```

## Project structure

- `src/app/` - application routes and pages
- `src/app/components/` - shared UI components
- `src/app/lib/` - sample finance data and Supabase helpers

## Notes

This project currently uses static demo data for accounts, transactions, budgets, and goals. Replace the sample data in `src/app/lib/data.js` with a real data source if you want to connect it to a backend.
