import { Link } from "@/lib/i18n-navigation";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";
import SupportCTA from "@/components/SupportCTA";

export const metadata = {
  title: "Support this blog",
  description: "Become a Supporter to unlock supporter-only posts and help keep the blog running.",
};

export const runtime = "nodejs";

export default async function BlogSupportPage() {
  const minUsd = Number(process.env.SUPPORT_MIN_USD || "5");
  const months = Number(process.env.SUPPORTER_MONTHS || "0");

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const address = (session as any)?.address as string | undefined;
  const addressLower = address ? address.toLowerCase() : "";

  const tierCopy =
    months > 0
      ? `Supporter access for ${months} ${months === 1 ? "month" : "months"}`
      : "Lifetime Supporter access";

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 dark:border-neutral-800">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
            Support this blog
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Become a Supporter
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            If you enjoy the writing, you can donate via crypto (Paymento). Your first successful
            donation unlocks <strong className="font-semibold">Supporter</strong>.{" "}
            <span className="text-neutral-700 dark:text-neutral-200">{tierCopy}.</span>
          </p>
        </header>

        {/* Card */}
        <section className="rounded-2xl border bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur dark:bg-neutral-900/60 dark:border-neutral-800 dark:ring-white/[0.04]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-medium">Why Support?</h2>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• Access ALL supporter-only posts{months > 0 ? ` for ${months} ${months === 1 ? "month" : "months"}` : ""}</li>
                <li>• Unlock commenting on supporter-level articles</li>
                <li>• Cheaper than buying articles individually</li>
                <li>• Additional donations extend your access period</li>
                <li>• Get a Supporter badge next to your comments</li>
                <li>• Directly fund development, research, and the caffeine behind it</li>
              </ul>
            </div>
            <div className="mt-3 w-full md:mt-0 md:w-60">
              <div className="rounded-xl border bg-neutral-50 px-4 py-3 dark:bg-neutral-800 dark:border-neutral-700">
                <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Suggested</div>
                <div className="mt-0.5 text-2xl font-semibold">
                  ${minUsd}
                  <span className="ml-1 align-middle text-sm font-normal text-neutral-500 dark:text-neutral-400">min.</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-5">
            <SupportCTA minUsd={minUsd} addressLower={addressLower} />
            {!addressLower && (
              <p className="mt-2 text-xs text-amber-600">
                We couldn’t detect your wallet address. Please sign in or connect so we can link your donation.
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              You’ll be redirected to Paymento’s secure gateway, then back here after payment.
            </p>
          </div>
        </section>

        {/* Tiny FAQ / Notes */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <h3 className="text-sm font-semibold">What do I get?</h3>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              Full access to all Supporter-only posts, plus the ability to comment on supporter-level articles.
              Your donation also displays a Supporter badge next to your comments.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <h3 className="text-sm font-semibold">What about OG content?</h3>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              OG (<em>sudopartypass</em>) content is reserved for members who received an exclusive invite.
              This tier is not available for purchase.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <h3 className="text-sm font-semibold">How long does access last?</h3>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              {months > 0 ? (
                <>
                  Supporter lasts <strong>{months}</strong> {months === 1 ? "month" : "months"} per donation.
                  Additional donations extend your access period.
                </>
              ) : (
                <>For now, it&apos;s lifetime. We may adjust in the future.</>
              )}
            </p>
          </div>
        </section>

        {/* Individual Article Purchases */}
        <section className="mt-6 rounded-xl border bg-neutral-50 p-4 dark:bg-neutral-900/50 dark:border-neutral-800">
          <h3 className="text-sm font-semibold">Or Buy Individual Articles</h3>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Prefer not to subscribe? Some articles can be purchased individually for permanent access.
            Look for the &quot;Buy for $X&quot; button on locked posts. Individual purchases grant
            content access only&mdash;commenting requires Supporter membership.
          </p>
        </section>

        {/* Footer nav */}
        <footer className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            ← Back to Blog
          </Link>
        </footer>
      </div>
    </main>
  );
}
