"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { ContextMeter } from "@/registry/ai/context-meter"

// Sample figures.
const SAMPLE_LIMIT = 200_000
const SAMPLE_FILE_TOKENS = 40_000
const sampleBase = { system: 2_100, messages: 61_300, files: 20_800 }

/**
 * No model or tokenizer is counting here. The numbers are samples, and the
 * button adds a 40,000-token file so the meter passes its two thresholds.
 */
export default function ContextMeterDemo() {
  const [addedFiles, setAddedFiles] = React.useState(0)
  const files = sampleBase.files + addedFiles * SAMPLE_FILE_TOKENS
  const used = sampleBase.system + sampleBase.messages + files

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <ContextMeter
        used={used}
        limit={SAMPLE_LIMIT}
        parts={[
          { label: "System prompt", tokens: sampleBase.system },
          { label: "Messages", tokens: sampleBase.messages },
          { label: "Files", tokens: files },
        ]}
        cost="$0.42"
        note="Sample figures. Nothing is counting tokens in this preview."
      />
      <div className="flex flex-wrap gap-[var(--hui-space-2)]">
        <Button variant="secondary" size="sm" onClick={() => setAddedFiles(addedFiles + 1)}>
          Add a 40,000-token file
        </Button>
        <Button variant="link" size="sm" disabled={addedFiles === 0} onClick={() => setAddedFiles(0)}>
          Reset
        </Button>
      </div>
    </div>
  )
}
