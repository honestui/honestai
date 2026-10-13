import type { Metadata } from "next";
import Link from "next/link";

import { AnalyticsPreferences } from "@/components/site-analytics";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Honest AI uses aggregate analytics, handles playground messages, and stores local preferences.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <header className="border-b border-[var(--hui-color-border-base-primary)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            aria-label="Honest AI docs home"
            className="rounded-[var(--hui-radius-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
            href="/docs"
          >
            <BrandWordmark className="text-[17px]" markClassName="size-7" />
          </Link>
          <Button render={<Link href="/docs" />} size="sm" variant="link">
            Documentation
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <h1 className="text-4xl font-medium tracking-tight">Privacy</h1>
        <p className="mt-4 text-sm text-[var(--hui-color-foreground-base-secondary)]">
          Last updated October 12, 2026
        </p>

        <div className="mt-10 space-y-10 text-base leading-7 text-[var(--hui-color-foreground-base-secondary)]">
          <section aria-labelledby="privacy-summary">
            <h2
              className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
              id="privacy-summary"
            >
              Privacy-focused analytics
            </h2>
            <p className="mt-3">
              Honest AI uses Vercel Web Analytics for aggregate traffic
              statistics. It does not use analytics cookies, session recording,
              or advertising trackers.
            </p>
          </section>

          <AnalyticsPreferences />

          <section aria-labelledby="analytics-data">
            <h2
              className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
              id="analytics-data"
            >
              What analytics collect
            </h2>
            <p className="mt-3">
              Vercel Analytics measures page visits and technical context such
              as route, referrer, device, browser, and approximate location.
              Honest AI removes query strings and URL fragments before an event
              is sent. Vercel states that its daily visitor hash cannot track a
              visitor between different days or websites and that visitor
              session identifiers are discarded after 24 hours.
            </p>
          </section>

          <section aria-labelledby="privacy-playground">
            <h2
              className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
              id="privacy-playground"
            >
              Playground messages
            </h2>
            <p className="mt-3">
              When you send a message in the playground on this site, the
              conversation goes through the Honest AI server to Google&apos;s
              Gemini API, which writes the reply. Honest AI does not save the
              conversation. The server keeps your IP address in memory, not in
              a database, to limit how often one visitor can send messages.
              Google handles what it receives under its own terms, so do not
              enter personal or sensitive information.
            </p>
          </section>

          <section aria-labelledby="privacy-storage">
            <h2
              className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
              id="privacy-storage"
            >
              Local storage and retention
            </h2>
            <p className="mt-3">
              If you disable analytics, Honest AI stores that preference in
              your browser. The documentation also stores interface preferences
              there: your theme customizer settings, your playground model
              choice, and a cookie that remembers whether the sidebar is open.
              None of these are analytics events.
            </p>
            <p className="mt-3">
              Vercel controls retention for its aggregated analytics service.
              Review the{" "}
              <a
                className="rounded-[var(--hui-radius-1)] underline underline-offset-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"
                href="https://vercel.com/docs/analytics/privacy-policy"
                rel="noreferrer"
                target="_blank"
              >
                Vercel Analytics privacy documentation
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              for their current practices.
            </p>
          </section>

          <section aria-labelledby="privacy-control">
            <h2
              className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
              id="privacy-control"
            >
              Change or clear your choice
            </h2>
            <p className="mt-3">
              Use the control above at any time. Disabling analytics stops new
              analytics events and remains in effect on this browser. Honest AI
              also disables analytics when your browser sends Global Privacy
              Control or Do Not Track.
            </p>
            <p className="mt-3">
              For a privacy question, open a{" "}
              <a
                className="rounded-[var(--hui-radius-1)] underline underline-offset-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"
                href="https://github.com/honestui/honestai/issues/new"
                rel="noreferrer"
                target="_blank"
              >
                GitHub issue
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              . Do not include personal or sensitive information in a public
              issue.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
