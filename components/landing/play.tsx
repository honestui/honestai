"use client";

import * as React from "react";

import { landingQuestionId, type LandingTopicId } from "@/components/landing/topics";

/** How long Thinking State shows before a written answer starts to replay. */
const THINKING_MILLISECONDS = 650;

export type LandingReplay = {
  topicId: LandingTopicId;
  /** Counts replays, so asking the same question again starts over. */
  run: number;
  phase: "thinking" | "replaying";
};

type LandingPlay = {
  replay: LandingReplay | null;
  /** Scrolls to a written answer, moves focus to its question, and replays it. */
  play: (topicId: LandingTopicId) => void;
};

const LandingPlayContext = React.createContext<LandingPlay | null>(null);

/**
 * Replays one written answer at a time. No model is involved: a timer stands
 * in for the wait, and the answer shown is the one already on the page. With
 * reduced motion there is no wait, and the answer appears as written.
 */
export function LandingPlayProvider({ children }: { children: React.ReactNode }) {
  const [replay, setReplay] = React.useState<LandingReplay | null>(null);
  const runCount = React.useRef(0);
  const thinkingTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(thinkingTimer.current), []);

  const play = React.useCallback((topicId: LandingTopicId) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(thinkingTimer.current);
    runCount.current += 1;
    const run = runCount.current;

    if (prefersReducedMotion) {
      setReplay({ topicId, run, phase: "replaying" });
    } else {
      setReplay({ topicId, run, phase: "thinking" });
      thinkingTimer.current = window.setTimeout(
        () => setReplay({ topicId, run, phase: "replaying" }),
        THINKING_MILLISECONDS,
      );
    }

    // Focus follows the scroll, so a screen reader starts reading at the answer.
    document.getElementById(landingQuestionId(topicId))?.focus({ preventScroll: true });
    document.getElementById(topicId)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${topicId}`);
  }, []);

  const value = React.useMemo(() => ({ replay, play }), [replay, play]);

  return <LandingPlayContext value={value}>{children}</LandingPlayContext>;
}

export function useLandingPlay() {
  const play = React.use(LandingPlayContext);
  if (!play) throw new Error("useLandingPlay needs a LandingPlayProvider above it.");
  return play;
}
