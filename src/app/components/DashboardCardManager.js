"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { cards as defaultCards } from "../lib/cards";

const defaultCardsBySlug = new Map(
  defaultCards.map((card) => [card.slug, card]),
);

export default function DashboardCardManager() {
  const router = useRouter();
  const { user } = useAuth();
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(defaultCards[0]?.slug ?? "");

  useEffect(() => {
    if (!user?.id) {
      setSavedCards([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadCards() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("dashboard_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setSavedCards(data ?? []);
      }
      setLoading(false);
    }

    loadCards();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const availableSections = useMemo(
    () =>
      defaultCards.filter(
        (card) => !savedCards.some((savedCard) => savedCard.slug === card.slug),
      ),
    [savedCards],
  );

  useEffect(() => {
    if (!availableSections.some((section) => section.slug === selectedSlug)) {
      setSelectedSlug(availableSections[0]?.slug ?? "");
    }
  }, [availableSections, selectedSlug]);

  const selectedSection = defaultCardsBySlug.get(selectedSlug) || null;

  async function handleAdd(event) {
    event.preventDefault();
    if (!selectedSlug || !user?.id || !selectedSection) return;

    setError(null);
    setSaving(true);

    const { data, error } = await supabase
      .from("dashboard_cards")
      .insert([
        {
          slug: selectedSection.slug,
          title: selectedSection.title,
          description: selectedSection.description,
          icon: selectedSection.icon,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      setSavedCards((prev) => [...prev, data]);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);

    const { error } = await supabase
      .from("dashboard_cards")
      .delete()
      .eq("id", id);
    setDeletingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSavedCards((prev) => prev.filter((card) => card.id !== id));
  }

  if (!user) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Sign in to manage your dashboard cards.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Dashboard cards</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add or remove the cards you want to see on your overview.
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {savedCards.length} visible card{savedCards.length === 1 ? "" : "s"}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading cards…
            </p>
          ) : savedCards.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No cards are configured yet. Use the form below to add a section
              card from your account.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/${card.slug}`)}
                    className="flex h-full w-full flex-col text-left"
                  >
                    <span className="mb-4 text-4xl">{card.icon}</span>
                    <h3 className="mb-2 text-xl font-semibold">{card.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.description}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card.id)}
                    disabled={deletingId === card.id}
                    className="absolute right-3 top-3 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    {deletingId === card.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            Section
            <select
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            >
              {availableSections.map((card) => (
                <option key={card.slug} value={card.slug}>
                  {card.title}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold">Preview</p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="text-2xl">{selectedSection?.icon}</p>
              <p className="mt-2 font-semibold">{selectedSection?.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSection?.description}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !availableSections.length}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add card"}
        </button>
      </form>
    </section>
  );
}
