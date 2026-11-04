"use client"

import * as React from "react"

import { FineTuneCard, type FineTuneValues } from "@/registry/ai/fine-tune-card"

const defaultValues: FineTuneValues = { temperature: 40, length: 300, tone: "neutral", format: "prose" }

/** Nothing is regenerated here. The values under the card are what `onValuesChange` receives. */
export default function FineTuneCardDemo() {
  const [values, setValues] = React.useState(defaultValues)

  return (
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-[var(--hui-space-3)]">
      <FineTuneCard
        title="Reply style"
        defaultValues={defaultValues}
        onValuesChange={setValues}
        controls={[
          { type: "number", id: "temperature", label: "Variety", min: 0, max: 100, step: 5 },
          { type: "number", id: "length", label: "Max words", min: 50, max: 1000, step: 50 },
          {
            type: "segment",
            id: "format",
            label: "Format",
            options: [
              { value: "prose", label: "Prose" },
              { value: "list", label: "List" },
            ],
          },
          {
            type: "select",
            id: "tone",
            label: "Tone",
            options: [
              { value: "neutral", label: "Neutral" },
              { value: "formal", label: "Formal" },
              { value: "friendly", label: "Friendly" },
            ],
          },
        ]}
      />
      {/* Labelled, so the serialized values read as feedback rather than stray output. */}
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)] rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-neutral-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
          Sent to <code className="font-mono">onValuesChange</code>
        </p>
        <p
          aria-live="polite"
          className="m-0 font-mono break-words text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mono-small)] [line-height:var(--hui-line-height-mono-small)]"
        >
          {JSON.stringify(values).replaceAll(",", ", ")}
        </p>
      </div>
    </div>
  )
}
