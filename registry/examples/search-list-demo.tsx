"use client"

import * as React from "react"

import { SearchList, type SearchListItem } from "@/registry/ai/search-list"

// Sample saved prompts.
const samplePrompts: SearchListItem[] = [
  { id: "summarize", label: "Summarize this thread", description: "Saved prompt" },
  { id: "review", label: "Review the last change", description: "Saved prompt" },
  { id: "plan", label: "Plan before editing", description: "Saved prompt" },
  { id: "tests", label: "Write tests for this file", description: "Saved prompt" },
  { id: "explain", label: "Explain this error", description: "Saved prompt" },
]

export default function SearchListDemo() {
  const [selected, setSelected] = React.useState<SearchListItem | null>(null)

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-3)]">
      <SearchList
        label="Search saved prompts"
        placeholder="Search saved prompts…"
        items={samplePrompts}
        onSelect={setSelected}
      />
      <p
        role="status"
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {selected ? `onSelect received “${selected.label}”` : "Nothing selected yet."}
      </p>
    </div>
  )
}
