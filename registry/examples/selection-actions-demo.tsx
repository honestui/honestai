"use client"

import * as React from "react"
import { Scissors as ScissorsIcon, Sparkles as SparklesIcon } from "honestui/icons"

import {
  SelectionActions,
  type SelectionActionsStatus,
} from "@/registry/ai/selection-actions"

// Sample passage and the rewrite each action stands in for.
const original = "Round the total once after the rows have all been added up together."
const rewrites: Record<string, string> = {
  improve: "Round the total once, after the rows are summed.",
  shorten: "Round once, after summing.",
}

const EDIT_MILLISECONDS = 1200

/**
 * No model edits this text. A timer stands in for the request, and each
 * action swaps in a fixed rewrite so you can keep or discard it.
 */
export default function SelectionActionsDemo() {
  const [text, setText] = React.useState(original)
  const [proposal, setProposal] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<SelectionActionsStatus>("idle")
  const pending = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(pending.current), [])

  const run = (rewrite: string) => {
    setStatus("working")
    pending.current = window.setTimeout(() => {
      setProposal(rewrite)
      setStatus("result")
    }, EDIT_MILLISECONDS)
  }

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col items-start gap-[var(--hui-space-3)]">
      <p className="m-0 [font-size:var(--hui-font-size-regular)] [line-height:1.6]">
        The export drifts by a cent.{" "}
        <mark className="rounded-[var(--hui-radius-1)] bg-[var(--hui-color-background-accent-primary)] px-0.5 text-[var(--hui-color-foreground-base-primary)]">
          {proposal ?? text}
        </mark>
      </p>
      <SelectionActions
        status={status}
        actions={[
          { id: "improve", label: "Improve", icon: <SparklesIcon aria-hidden="true" /> },
          { id: "shorten", label: "Shorten", icon: <ScissorsIcon aria-hidden="true" /> },
        ]}
        onAction={(actionId) => run(rewrites[actionId])}
        onPrompt={(instruction) => run(`${text} (${instruction})`)}
        onKeep={() => {
          if (proposal) setText(proposal)
          setProposal(null)
          setStatus("idle")
        }}
        onDiscard={() => {
          setProposal(null)
          setStatus("idle")
        }}
      />
    </div>
  )
}
