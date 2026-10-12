"use client"

import * as React from "react"
import { FileText as FileTextIcon } from "honestui/icons"

import { SearchList } from "@/registry/ai/search-list"

export default function SearchListThreadsExample() {
  const [opened, setOpened] = React.useState("")

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-3)]">
      <SearchList
        label="Search recent threads"
        placeholder="Search recent threads…"
        emptyMessage="No threads match. Clear the search to see them all."
        items={[
          { id: "t1", label: "Billing export rounding", icon: <FileTextIcon /> },
          { id: "t2", label: "Staging migration plan", icon: <FileTextIcon /> },
          { id: "t3", label: "Focus ring contrast", icon: <FileTextIcon /> },
        ]}
        onSelect={(item) => setOpened(item.label)}
      />
      <p
        role="status"
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {opened ? `Opened “${opened}”` : ""}
      </p>
    </div>
  )
}
