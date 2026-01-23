import { Suspense } from "react";
import SupportReturnClient from "./client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Payment verification",
  description: "Confirming your supporter payment.",
};

function Fallback() {
  return (
    <main className="min-h-[70vh] bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 dark:border-neutral-800">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
          Payment verification
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Verifying payment…</h1>
        <div className="mt-6 h-28 rounded-2xl border bg-white/80 shadow-sm ring-1 ring-black/[0.03] dark:bg-neutral-900/60 dark:border-neutral-800 dark:ring-white/[0.04]" />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <SupportReturnClient />
    </Suspense>
  );
}
