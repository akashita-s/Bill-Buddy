"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { currency } from "../lib/data";
import { supabase } from "../lib/supabase";

const missingTeamSchemaMessage =
  "Team tables are missing in Supabase. Run supabase/team.sql in your Supabase SQL editor, then refresh this page.";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: next.toISOString().slice(0, 10),
  };
}

function isMissingTableError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function StatCard({ label, value, accent = "" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const loadTeam = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("id, member_id, member_email")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipError) {
      setError(
        isMissingTableError(membershipError)
          ? missingTeamSchemaMessage
          : membershipError.message,
      );
      setRows([]);
      setLoading(false);
      return;
    }

    const memberIds = [
      user.id,
      ...(memberships ?? []).map((member) => member.member_id),
    ].filter(Boolean);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", memberIds);

    if (profilesError) {
      setError(
        isMissingTableError(profilesError)
          ? missingTeamSchemaMessage
          : profilesError.message,
      );
      setRows([]);
      setLoading(false);
      return;
    }

    const { from, to } = getCurrentMonthRange();
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("user_id, amount")
      .in("user_id", memberIds)
      .gte("date", from)
      .lt("date", to);

    if (expensesError) {
      setError(expensesError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: balances, error: balancesError } = await supabase
      .from("account_balances")
      .select("user_id, balance")
      .in("user_id", memberIds);

    if (balancesError) {
      setError(
        isMissingTableError(balancesError)
          ? missingTeamSchemaMessage
          : balancesError.message,
      );
      setRows([]);
      setLoading(false);
      return;
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const monthlyExpenseById = new Map();
    for (const expense of expenses ?? []) {
      monthlyExpenseById.set(
        expense.user_id,
        (monthlyExpenseById.get(expense.user_id) ?? 0) + Number(expense.amount),
      );
    }

    const balanceById = new Map(
      (balances ?? []).map((balance) => [balance.user_id, Number(balance.balance)]),
    );

    setRows(
      memberIds.map((memberId) => {
        const membership = (memberships ?? []).find(
          (member) => member.member_id === memberId,
        );
        return {
          id: membership?.id ?? "current-user",
          userId: memberId,
          email:
            profilesById.get(memberId)?.email ??
            membership?.member_email ??
            user.email ??
            "Unknown member",
          monthlyExpense: monthlyExpenseById.get(memberId) ?? 0,
          balance: balanceById.get(memberId) ?? 0,
          isCurrentUser: memberId === user.id,
        };
      }),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const totalMonthlyExpense = useMemo(
    () => rows.reduce((sum, member) => sum + Number(member.monthlyExpense), 0),
    [rows],
  );

  const totalTeamBalance = useMemo(
    () => rows.reduce((sum, member) => sum + Number(member.balance), 0),
    [rows],
  );

  async function addMember(event) {
    event.preventDefault();
    if (!user) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setAdding(true);
    setError(null);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    if (profileError) {
      setError(
        isMissingTableError(profileError)
          ? missingTeamSchemaMessage
          : "No Supabase user profile was found for that email.",
      );
      setAdding(false);
      return;
    }

    if (profile.id === user.id) {
      setError("You are already on the team.");
      setAdding(false);
      return;
    }

    const { error: insertError } = await supabase.from("team_members").insert({
      owner_id: user.id,
      member_id: profile.id,
      member_email: profile.email,
    });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That email is already on your team."
          : insertError.message,
      );
      setAdding(false);
      return;
    }

    setEmail("");
    setAdding(false);
    loadTeam();
  }

  async function deleteMember(member) {
    setDeletingId(member.id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("id", member.id);

    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== member.id));
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-4">
      <header className="mt-6 mb-8 flex items-center gap-4">
        <span className="text-5xl">👥</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track monthly expenses and balances across your team.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total monthly expense"
          value={loading ? "Loading..." : currency(totalMonthlyExpense)}
          accent="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Team balance"
          value={loading ? "Loading..." : currency(totalTeamBalance)}
          accent="text-blue-600 dark:text-blue-400"
        />
        <StatCard label="Members" value={loading ? "..." : rows.length} />
      </section>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Add team member</h2>
        <form
          onSubmit={addMember}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <label className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:text-white"
              required
            />
          </label>
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add user"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Members</h2>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading team from Supabase...
          </p>
        ) : (
          <>
            <ul className="space-y-3 sm:hidden">
              {rows.map((member) => (
                <li
                  key={member.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.email}</p>
                      {member.isCurrentUser ? (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Current user
                        </p>
                      ) : null}
                    </div>
                    {!member.isCurrentUser ? (
                      <button
                        type="button"
                        onClick={() => deleteMember(member)}
                        disabled={deletingId === member.id}
                        className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                      >
                        {deletingId === member.id ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Monthly expense
                      </p>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        {currency(member.monthlyExpense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total balance
                      </p>
                      <p className="font-semibold">{currency(member.balance)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 dark:bg-neutral-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Member</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Monthly expense
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      Total balance
                    </th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <tr
                      key={member.id}
                      className="border-t border-gray-100 dark:border-neutral-800"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{member.email}</p>
                        {member.isCurrentUser ? (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current user
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">
                        {currency(member.monthlyExpense)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {currency(member.balance)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {member.isCurrentUser ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Auto
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => deleteMember(member)}
                            disabled={deletingId === member.id}
                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                          >
                            {deletingId === member.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
