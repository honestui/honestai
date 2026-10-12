"use client"

import * as React from "react"

import { ThinkingState, ThinkingStep } from "@/registry/ai/thinking-state"
import { Button } from "@/components/ui/button"

// Sample trace.
const sampleSteps = [
  { id: "read", label: "Reading the export module", detail: "3 files" },
  { id: "trace", label: "Tracing where totals are rounded" },
  { id: "compare", label: "Comparing against the invoice schema", detail: "12 fields" },
  { id: "plan", label: "Writing the change plan" },
]

const STEP_MILLISECONDS = 900

/**
 * No agent runs behind this preview. A timer completes one step at a time so
 * you can see the running state settle; your application sets `status` and
 * the steps from its own events.
 */
export default function ThinkingStateDemo() {
  const [completed, setCompleted] = React.useState(0)
  const isRunning = completed < sampleSteps.length

  React.useEffect(() => {
    if (!isRunning) return
    const timer = window.setTimeout(() => setCompleted((count) => count + 1), STEP_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [completed, isRunning])

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col items-start gap-[var(--hui-space-5)]">
      <ThinkingState
        status={isRunning ? "running" : "done"}
        label={isRunning ? "Thinking" : `Finished ${sampleSteps.length} steps`}
      >
        {sampleSteps.slice(0, completed + 1).map((step, index) => (
          <ThinkingStep
            key={step.id}
            status={index < completed ? "done" : "running"}
            detail={step.detail}
          >
            {step.label}
          </ThinkingStep>
        ))}
      </ThinkingState>
      <Button variant="secondary" size="sm" disabled={isRunning} onClick={() => setCompleted(0)}>
        Run the sample again
      </Button>
    </div>
  )
}
