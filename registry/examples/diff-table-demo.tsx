"use client"

import * as React from "react"

import { DiffTable, type DiffTableRow } from "@/registry/ai/diff-table"

// Sample rows.
const sampleRows: DiffTableRow[] = [
  { id: "legacy", change: "removed", name: "legacy_region", cells: { column: "legacy_region", type: "text" } },
  { id: "fax", change: "removed", name: "fax_number", cells: { column: "fax_number", type: "text" } },
  { id: "email", change: "unchanged", name: "email", cells: { column: "email", type: "text" } },
  { id: "region", change: "added", name: "region_id", cells: { column: "region_id", type: "uuid" } },
]

/** This preview applies nothing. It shows the row ids your `onApply` receives. */
export default function DiffTableDemo() {
  const [applied, setApplied] = React.useState<string[] | null>(null)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <DiffTable
        title="Proposed changes to the customers table"
        columns={[
          { id: "column", header: "Column" },
          { id: "type", header: "Type" },
        ]}
        rows={sampleRows}
        onApply={setApplied}
      />
      <p
        role="status"
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {applied ? `onApply received: ${applied.join(", ")}` : ""}
      </p>
    </div>
  )
}
