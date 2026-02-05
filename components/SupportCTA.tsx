"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";

export default function SupportCTA({
  minUsd = 5,
  addressLower,
}: {
  minUsd?: number;
  addressLower: string;
}) {
  const t = useTranslations();
  const [amount, setAmount] = useState<number>(minUsd);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasWallet = Boolean(addressLower);
  const isDisabled = busy || !hasWallet;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/support/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiatAmount: amount,
          fiatCurrency: "USD",
          addressLower,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.redirectUrl)
        throw new Error(data?.error || t("common.somethingWentWrong"));
      window.location.href = data.redirectUrl as string;
    } catch (err: any) {
      setError(err.message || t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="not-prose">
      <label className="block mb-2">
        <span className="mr-2">Amount (USD):</span>
        <input
          type="number"
          min={minUsd}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border rounded px-2 py-1"
          required
        />
      </label>
      <button
        type="submit"
        disabled={isDisabled}
        className={`inline-flex items-center border rounded px-3 py-1 transition-colors ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
        }`}
      >
        {busy ? t("common.redirecting") : "Support via Paymento"}
      </button>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
    </form>
  );
}
