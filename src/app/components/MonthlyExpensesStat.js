"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { currency } from "../lib/data";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: next.toISOString().slice(0, 10),
  };
}

export default function MonthlyExpensesStat({ fallback }) {
  const { user, loading } = useAuth();
  const [amount, setAmount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function load() {
      const { from, to } = getCurrentMonthRange();
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", from)
        .lt("date", to);

      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }

      setAmount((data ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || amount === null || error) {
    return currency(fallback ?? 0);
  }

  return currency(amount);
}
