"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { currency } from "../lib/data";

// Fetches the signed-in user's expenses from Supabase. RLS limits the rows
// to those owned by the current user, so no extra filtering is needed here.
export default function LiveExpenses() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [monthWasAutoSelected, setMonthWasAutoSelected] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthKey = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  };

  const monthLabel = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const selectedExpense = deleteTarget
    ? rows.find((row) => row.id === deleteTarget)
    : null;

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    return true;
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await handleDelete(deleteTarget);
    if (success) {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (!active) return;
      if (error) setError(error.message);
      else setRows(data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const months = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => monthKey(r.date)).filter(Boolean)),
      ).sort((a, b) => b.localeCompare(a)),
    [rows],
  );

  const latestMonth = months[0] ?? "all";

  useEffect(() => {
    if (!monthWasAutoSelected && month === "all" && months.length > 0) {
      setMonth(latestMonth);
      setMonthWasAutoSelected(true);
    }
  }, [month, months.length, latestMonth, monthWasAutoSelected]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading expenses…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Could not load expenses: {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No expenses yet —{" "}
        <Link
          href="/add-expense"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          add one
        </Link>
        .
      </p>
    );
  }

  // Distinct categories and users present in the expenses, for the dropdowns.
  const categories = Array.from(
    new Set(rows.map((r) => r.category).filter(Boolean)),
  ).sort();

  const users = Array.from(
    new Set(rows.map((r) => r.email).filter(Boolean)),
  ).sort();

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const matchesText =
      !q ||
      (r.title ?? "").toLowerCase().includes(q) ||
      (r.category ?? "").toLowerCase().includes(q);
    const matchesCategory = category === "all" || r.category === category;
    const matchesMonth = month === "all" || monthKey(r.date) === month;
    const matchesUser = selectedUser === "all" || r.email === selectedUser;
    return matchesText && matchesCategory && matchesMonth && matchesUser;
  });

  const isFiltered =
    q !== "" || category !== "all" || month !== "all" || selectedUser !== "all";
  const total = filtered.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by description or category…"
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
        />
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 sm:w-56"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(`${m}-01`)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 sm:w-56"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 sm:w-56"
        >
          <option value="all">All users</option>
          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isFiltered ? "Total (filtered)" : "Total spent"}
        </p>
        <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
          {currency(total)}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No expenses match the current filters.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards so nothing gets clipped on narrow screens. */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map((x) => (
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
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span>{x.date ? String(x.date).slice(0, 10) : "—"}</span>
                    {x.category && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                        {x.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(x.id)}
                    disabled={deletingId === x.id}
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                    aria-label={
                      deletingId === x.id
                        ? "Deleting expense"
                        : "Delete expense"
                    }
                  >
                    {deletingId === x.id ? (
                      <span className="text-[10px]">…</span>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M6 7a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm2 3a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm-7-4h8l.75.75A1 1 0 0 1 17 7v1H7V7a1 1 0 0 1 .25-.75L8 6Zm11 3a1 1 0 0 1 1 1v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a1 1 0 1 1 2 0v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V10a1 1 0 0 1 1-1Z" />
                      </svg>
                    )}
                  </button>
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
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr
                    key={x.id}
                    className="border-t border-gray-100 dark:border-neutral-800"
                  >
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                      {x.date ? String(x.date).slice(0, 10) : "—"}
                    </td>
                    <td className="px-6 py-3 font-medium">{x.title}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                      {x.category ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                      {x.email ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-red-600 dark:text-red-400">
                      {currency(Number(x.amount))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(x.id)}
                        disabled={deletingId === x.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                        aria-label={
                          deletingId === x.id
                            ? "Deleting expense"
                            : "Delete expense"
                        }
                      >
                        {deletingId === x.id ? (
                          <span className="text-[10px]">…</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M6 7a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm2 3a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm-7-4h8l.75.75A1 1 0 0 1 17 7v1H7V7a1 1 0 0 1 .25-.75L8 6Zm11 3a1 1 0 0 1 1 1v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a1 1 0 1 1 2 0v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V10a1 1 0 0 1 1-1Z" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete expense
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete
              {selectedExpense?.title
                ? ` “${selectedExpense.title}”`
                : " this expense"}
              ?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deletingId === deleteTarget}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleteTarget}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === deleteTarget ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
