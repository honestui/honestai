"use client";

import * as React from "react";

import { useLandingPlay } from "@/components/landing/play";
import { landingQuestionId, type LandingTopic } from "@/components/landing/topics";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/registry/ai/chat-thread";
import { StreamingText, useSmoothStream } from "@/registry/ai/streaming-text";
import { ThinkingState } from "@/registry/ai/thinking-state";

/** Fast enough that a replayed answer does not keep a reader waiting. */
const REPLAY_CHARACTERS_PER_SECOND = 240;

const proseSize = "[--prose-flow:var(--hui-space-5)] [--prose-size:0.9375rem] [--prose-width:38rem]";

/** The rest of an answer, in the Prose stylesheet the page describes. */
function AnswerBody({
  hidden = false,
  fadesIn = false,
  children,
}: {
  hidden?: boolean;
  /** Set for a replay only, so the page's first paint is not animated. */
  fadesIn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      hidden={hidden}
      className={cn(
        "honest-prose [&>:first-child]:mt-0!",
        proseSize,
        fadesIn && "motion-safe:animate-in motion-safe:fade-in",
      )}
    >
      {children}
    </div>
  );
}

/** Streams the first paragraph again, then shows the rest of the answer. */
function ReplayedAnswer({ lead, children }: { lead: string; children: React.ReactNode }) {
  const stream = useSmoothStream(lead, { charactersPerSecond: REPLAY_CHARACTERS_PER_SECOND });

  return (
    <>
      <div data-slot="message-content">
        <StreamingText
          status={stream.isSettled ? "complete" : "streaming"}
          // Focus is already on the question, so the text is read from there.
          announce={false}
          contentClassName={proseSize}
        >
          {stream.text}
        </StreamingText>
      </div>
      <AnswerBody hidden={!stream.isSettled} fadesIn>
        {children}
      </AnswerBody>
    </>
  );
}

export type LandingExchangeProps = {
  topic: LandingTopic;
  /** The answer's first paragraph, as plain text. A replay streams it. */
  lead: string;
  /** The rest of the answer. */
  children: React.ReactNode;
};

/**
 * One question and its written answer. Both rows are marked for Message
 * Scroller, so the rail beside the conversation can list and preview them.
 */
export function LandingExchange({ topic, lead, children }: LandingExchangeProps) {
  const { replay } = useLandingPlay();
  const ownReplay = replay?.topicId === topic.id ? replay : null;
  const questionId = landingQuestionId(topic.id);

  return (
    <section
      id={topic.id}
      aria-labelledby={questionId}
      className="flex scroll-mt-[var(--hui-space-7)] flex-col gap-[var(--hui-space-6)]"
    >
      <ChatMessage role="user" author="Question" data-slot="message" data-from="user">
        {/* A replay moves focus here. */}
        <h2
          id={questionId}
          tabIndex={-1}
          data-slot="message-content"
          className="m-0 rounded-[var(--hui-radius-1)] font-sans! text-[length:var(--hui-font-size-large)]! leading-[var(--hui-line-height-large)]! font-medium! outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
        >
          {topic.question}
        </h2>
      </ChatMessage>
      <ChatMessage role="assistant" author="Honest AI" data-slot="message" data-from="assistant">
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-5)]">
          {ownReplay?.phase === "thinking" ? (
            <ThinkingState status="running" label="Finding the written answer" />
          ) : ownReplay ? (
            <ReplayedAnswer key={ownReplay.run} lead={lead}>
              {children}
            </ReplayedAnswer>
          ) : (
            <>
              <div data-slot="message-content">
                <StreamingText announce={false} contentClassName={proseSize}>
                  {lead}
                </StreamingText>
              </div>
              <AnswerBody>{children}</AnswerBody>
            </>
          )}
        </div>
      </ChatMessage>
    </section>
  );
}
