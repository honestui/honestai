import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "honestui/icons";

import { LandingComposer } from "@/components/landing/composer";
import { LandingConversation } from "@/components/landing/conversation";
import { LandingPlayProvider } from "@/components/landing/play";
import { LandingHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import { HONEST_UI_URL, SITE_DESCRIPTION, SITE_TITLE } from "@/globals/constants/site";
import { MessageScroller } from "@/registry/ai/message-scroller";

// The title and description are the site defaults set in the root layout.
// The preview image beside this file is wide, so this page asks for the large card.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@cando145",
  },
};

const footerLinkClass =
  "rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:text-[var(--hui-color-foreground-base-primary)] hover:underline focus-visible:[outline:var(--hui-focus-ring)]";

const column = "mx-auto w-full max-w-[44rem] px-5 sm:px-8";

export default function Home() {
  return (
    // On a tall enough viewport the page is a chat layout: the conversation
    // scrolls between the header and the prompt field. On a short one, or at
    // high zoom, nothing is pinned and the whole page scrolls instead.
    <div className="flex min-h-svh flex-col bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] [@media(min-height:40rem)]:h-svh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-sm font-medium shadow-[var(--hui-shadow-lifted)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:[outline:var(--hui-focus-ring)]"
      >
        Skip to main content
      </a>

      <LandingHeader />

      <LandingPlayProvider>
        <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
          <MessageScroller
            label="Conversation about Honest AI"
            navigation="rail"
            navigationLabel="Questions and answers"
            // The page opens at its headline, not at the newest message.
            followOutput={false}
            className="flex-1"
            // The site styles every native scrollbar, which would draw one beside
            // the rail. The rail also takes room on the right once it shows, so
            // match it on the left to keep the column centered over the prompt field.
            viewportClassName="no-scrollbar sm:pl-10"
            // A replay moves focus to the question, so the log does not also announce it.
            contentProps={{ "aria-live": "off" }}
            contentClassName={`${column} pb-[var(--hui-space-13)]`}
          >
            <div className="flex flex-col items-center pt-[var(--hui-space-9)] pb-[var(--hui-space-8)] text-center">
              <h1 className="max-w-[36rem] text-[clamp(2rem,7vw,3rem)]! leading-[1.05]! font-medium tracking-[var(--hui-letter-spacing-t4)]">
                React components for agent and chat interfaces
              </h1>
              <p className="mt-[var(--hui-space-6)] max-w-[34rem] text-base leading-7 text-pretty text-[var(--hui-color-foreground-base-secondary)] sm:text-lg">
                Honest AI is a set of React components you copy into your
                project. Each one renders only the state your application
                passes in, so your interface never shows progress your agent
                did not report.
              </p>
              <div className="mt-[var(--hui-space-6)] flex flex-wrap justify-center gap-[var(--hui-space-3)]">
                <Button render={<Link href="/docs" />} size="lg">
                  Read the documentation
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button render={<Link href="/docs/installation" />} size="lg" variant="secondary">
                  Install a component
                </Button>
              </div>
            </div>

            {/* Set like the system line that opens a chat transcript. */}
            <p className="mb-[var(--hui-space-8)] flex items-center gap-[var(--hui-space-4)] text-xs leading-5 text-[var(--hui-color-foreground-base-secondary)] before:h-px before:min-w-4 before:flex-1 before:bg-[var(--hui-color-border-base-primary)] after:h-px after:min-w-4 after:flex-1 after:bg-[var(--hui-color-border-base-primary)]">
              <span className="max-w-[26rem] text-center text-balance">
                A conversation about Honest AI, built with its own components.
                The answers were written in advance. No model runs on this page.
              </span>
            </p>

            <LandingConversation />
          </MessageScroller>

          <LandingComposer />
        </main>
      </LandingPlayProvider>

      {/* The small print under the prompt field. */}
      <footer>
        <p className={`${column} flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-[var(--hui-space-4)] text-xs text-[var(--hui-color-foreground-base-secondary)]`}>
          <span>MIT licensed</span>
          <Link className={footerLinkClass} href="/docs">
            Documentation
          </Link>
          <Link className={footerLinkClass} href="/privacy">
            Privacy
          </Link>
          <a className={footerLinkClass} href={HONEST_UI_URL}>
            Honest UI
          </a>
        </p>
      </footer>
    </div>
  );
}
