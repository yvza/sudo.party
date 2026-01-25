"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";

type Props = {
  slug: string;
  price: number;
  addressLower: string;
};

export default function ArticlePurchaseCTA({ slug, price, addressLower }: Props) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/support/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiatAmount: price,
          fiatCurrency: "USD",
          addressLower,
          articleSlug: slug,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.redirectUrl) {
        throw new Error(data?.error || t('common.somethingWentWrong'));
      }

      // Save the article URL for redirect after payment
      try {
        sessionStorage.setItem("support.returnTo", `/blog/post/${slug}`);
        sessionStorage.setItem("support.purchaseType", "article");
        sessionStorage.setItem("support.articleSlug", slug);
      } catch {}

      window.location.href = data.redirectUrl as string;
    } catch (err: any) {
      setError(err.message || t('common.somethingWentWrong'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur dark:bg-neutral-900/60 dark:border-neutral-800 dark:ring-white/[0.04]">
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold">{t('supporter.buyArticle')}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t('supporter.permanentAccess')}
        </p>
        <div className="text-2xl font-bold">${price}</div>
        <form onSubmit={onSubmit} className="not-prose">
          <button
            type="submit"
            disabled={busy || !addressLower}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {busy ? t('common.redirecting') : t('supporter.buyFor', { price: `$${price}` })}
          </button>
          {!addressLower && (
            <p className="mt-2 text-xs text-amber-600">
              {t('auth.signInDescription')}
            </p>
          )}
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </form>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('payment.redirectingToBlog')}
        </p>
      </div>
    </div>
  );
}
