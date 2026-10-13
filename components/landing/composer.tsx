"use client";

import * as React from "react";
import Link from "next/link";

import { useLandingPlay } from "@/components/landing/play";
import { findLandingTopic, landingTopics } from "@/components/landing/topics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PromptBar } from "@/registry/ai/prompt-bar";

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]";

/**
 * The prompt field under the landing conversation. No model answers it: a
 * question replays the written answer it matches, and a question that
 * matches none says so and points to the documentation.
 */
export function LandingComposer() {
  const { play } = useLandingPlay();
  const [unmatchedQuestion, setUnmatchedQuestion] = React.useState<string | null>(null);

  return (
    <div className="relative z-10 bg-[var(--hui-color-background-base-primary)] pt-[var(--hui-space-2)] pb-[var(--hui-space-3)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-10 before:bg-[linear-gradient(to_top,var(--hui-color-background-base-primary),transparent)]">
      <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-[var(--hui-space-3)] px-5 sm:px-8">
        <nav aria-label="Questions answered on this page">
          <ul className="no-scrollbar m-0 flex list-none gap-[var(--hui-space-2)] overflow-x-auto p-[var(--hui-space-1)] sm:justify-center">
            {landingTopics.map((topic) => (
              <li key={topic.id} className="shrink-0">
                {/* A plain link without scripts; with them, it also replays the answer. */}
                <Button
                  render={<a href={`#${topic.id}`} />}
                  variant="secondary"
                  onClick={(event) => {
                    event.preventDefault();
                    setUnmatchedQuestion(null);
                    play(topic.id);
                  }}
                >
                  {topic.shortLabel}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <p
          role="status"
          className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)] empty:hidden", smallText)}
        >
          {unmatchedQuestion !== null && (
            <>
              No written answer matches &ldquo;{unmatchedQuestion}&rdquo;, and
              no model runs on this page. Try a question above, or{" "}
              <Link
                href="/docs"
                className="rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] underline underline-offset-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"
              >
                read the documentation
              </Link>
              .
            </>
          )}
        </p>

        <PromptBar
          placeholder="Ask about installing, the components, approvals…"
          labels={{ prompt: "Ask a question about Honest AI" }}
          onSubmit={({ text }) => {
            const topic = findLandingTopic(text);
            setUnmatchedQuestion(topic ? null : text);
            if (topic) play(topic.id);
          }}
          actions={
            <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
              Scripted. No model runs here.
            </span>
          }
        />
      </div>
    </div>
  );
}
