"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/i18n-navigation";
import { useSearchParams } from "next/navigation";

type VerifyResp =
  | { ok: true; message: string }
  | { ok: false; message: string; reason?: string; status?: number };

type PurchaseInfo = {
  type: "article" | "supporter";
  articleSlug?: string;
};

export default function SupportReturnClient() {
  const qp = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => qp?.get("token") ?? "", [qp]);
  const fromParam = useMemo(() => qp?.get("from") ?? "", [qp]);

  const [state, setState] = useState<"idle" | "verifying" | "done">("idle");
  const [resp, setResp] = useState<VerifyResp | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo>({ type: "supporter" });
  const abortRef = useRef<AbortController | null>(null);

  const returnTo = useMemo<string>(() => {
    if (fromParam && fromParam.startsWith("/")) return fromParam;
    try {
      const saved = sessionStorage.getItem("support.returnTo");
      if (saved && saved.startsWith("/")) return saved;
    } catch {}
    return "/blog";
  }, [fromParam]);

  // Load purchase info from sessionStorage
  useEffect(() => {
    try {
      const purchaseType = sessionStorage.getItem("support.purchaseType");
      const articleSlug = sessionStorage.getItem("support.articleSlug");
      if (purchaseType === "article" && articleSlug) {
        setPurchaseInfo({ type: "article", articleSlug });
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setResp({ ok: false, message: "Missing token in URL.", reason: "missing_token" });
        setState("done");
        return;
      }

      setState("verifying");
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Retry configuration for pending payments
      const MAX_RETRIES = 5;
      const INITIAL_DELAY = 2000; // 2 seconds
      const PENDING_REASONS = ["not_completed", "pending", "processing"];

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          const r = await fetch("/api/paymento/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ token }),
            signal: abortRef.current.signal,
          });

          let data: any = null;
          try {
            data = await r.json();
          } catch {
            data = null;
          }

          const success = data?.ok === true;
          const isPending = !success && PENDING_REASONS.includes(data?.reason);

          // If pending and we have retries left, wait and retry
          if (isPending && attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY * Math.pow(1.5, attempt); // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Final result (success, permanent failure, or exhausted retries)
          const message = success
            ? (data?.message || "Payment verified and processed.")
            : isPending
            ? "Payment is still processing. Please wait a moment and refresh, or check your email for confirmation."
            : (data?.error || data?.message || "Payment verification failed.");

          if (!cancelled) {
            setResp(
              success
                ? { ok: true, message }
                : { ok: false, message, reason: data?.reason, status: data?.status }
            );
            setState("done");
          }
          return;
        } catch (e: any) {
          // Network error - retry if we have attempts left
          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY * Math.pow(1.5, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          if (!cancelled) {
            setResp({
              ok: false,
              message: "Network error during verification. Your payment may still be processing.",
              reason: e?.message || "fetch_failed",
            });
            setState("done");
          }
          return;
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [token]);

  const isOK = resp?.ok === true;
  const isArticlePurchase = purchaseInfo.type === "article";

  useEffect(() => {
    if (!isOK) return;

    // Clear sessionStorage
    try {
      sessionStorage.removeItem("support.returnTo");
      sessionStorage.removeItem("support.purchaseType");
      sessionStorage.removeItem("support.articleSlug");
    } catch {}

    // Shorter countdown for article purchases (5s) vs supporter (15s)
    const redirectTime = isArticlePurchase ? 5 : 15;
    setCountdown(redirectTime);

    const intervalId = window.setInterval(() => {
      setCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      router.replace(returnTo);
    }, redirectTime * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isOK, router, returnTo, isArticlePurchase]);

  // Dynamic title and message based on purchase type
  const successTitle = isArticlePurchase ? "Article purchased!" : "Payment verified";
  const successMessage = isArticlePurchase
    ? "You now have permanent access to this article."
    : resp?.message || "Payment verified and processed.";
  const buttonText = isArticlePurchase ? "Read article now" : "Continue now";

  return (
    <main className="min-h-[70vh] bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 dark:border-neutral-800">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
            {isArticlePurchase ? "Article purchase" : "Payment verification"}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {state !== "done" ? "Verifying payment…" : isOK ? successTitle : "Verification failed"}
          </h1>
        </header>

        <section className="rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-black/[0.03] backdrop-blur dark:bg-neutral-900/60 dark:border-neutral-800 dark:ring-white/[0.04]">
          <div
            className={[
              "mb-4 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs",
              state !== "done"
                ? "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                : isOK
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                state !== "done" ? "bg-neutral-400" : isOK ? "bg-green-500" : "bg-amber-500",
              ].join(" ")}
            />
            <span className="font-medium">
              {state !== "done" ? "Processing" : isOK ? "Success" : "Attention needed"}
            </span>
          </div>

          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {state !== "done"
              ? "Please wait while we confirm your payment on-chain."
              : isOK
              ? successMessage
              : resp?.message || "We couldn't verify your payment."}
          </p>

          {isOK && (
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Redirecting in {countdown}s… If it doesn&apos;t,{" "}
              <button
                onClick={() => router.replace(returnTo)}
                className="underline underline-offset-2 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                continue
              </button>
              .
            </p>
          )}

          {!!resp && !isOK && resp.reason && (
            <details className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              <summary className="cursor-pointer">Technical detail</summary>
              <div className="mt-1">
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">{resp.reason}</code>
                {typeof resp.status !== "undefined" && (
                  <span className="ml-2">
                    status: <code>{String(resp.status)}</code>
                  </span>
                )}
              </div>
            </details>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {isOK ? (
              <>
                <Link
                  href={returnTo}
                  className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  {buttonText}
                </Link>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">You can safely close this tab.</span>
              </>
            ) : state === "done" ? (
              <>
                <Link
                  href="/blog/support"
                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Try again
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Back to blog
                </Link>
              </>
            ) : null}
          </div>
        </section>

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
          We verify directly with the payment gateway. Refreshing this page won&apos;t charge you again.
        </p>
      </div>
    </main>
  );
}
