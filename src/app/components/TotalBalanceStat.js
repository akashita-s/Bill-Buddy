"use client";

import { useEffect, useState } from "react";
import { accountsTotal, accountStorageKey, initialAccounts, normalizeAccount } from "../lib/accounts";
import { currency } from "../lib/data";

function readSavedAccounts() {
  const stored = window.localStorage.getItem(accountStorageKey);
  if (!stored) return initialAccounts;

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return initialAccounts;
    return parsed.map(normalizeAccount);
  } catch {
    return initialAccounts;
  }
}

export default function TotalBalanceStat({ fallback }) {
  const [total, setTotal] = useState(fallback ?? accountsTotal(initialAccounts));

  useEffect(() => {
    const updateTotal = () => {
      setTotal(accountsTotal(readSavedAccounts()));
    };

    updateTotal();
    window.addEventListener("storage", updateTotal);

    return () => {
      window.removeEventListener("storage", updateTotal);
    };
  }, []);

  return currency(total);
}
