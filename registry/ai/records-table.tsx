"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// The frame is drawn here rather than by a Table variant, so the component
// keeps it when Table is installed from Honest UI. Cells wrap between words
// first, so short values such as "EMEA" do not split at narrow widths.
const tableFrame =
  "overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)] [&_thead]:bg-[var(--hui-color-background-base-secondary)] [&_th]:bg-[var(--hui-color-background-base-secondary)] [&_td]:text-[var(--hui-color-foreground-base-primary)] [&_td]:[overflow-wrap:break-word] [&_tbody>tr:last-child>td]:border-b-0"

export type RecordsTableColumn = {
  id: string
  header: string
  /** Marks a column whose cells an agent fills in. */
  isGenerated?: boolean
}

export type GeneratedCell =
  | { status: "queued" }
  | { status: "running" }
  | { status: "done"; value: React.ReactNode }
  | { status: "error"; message?: string }

export type RecordsTableRow = {
  id: string
  /** Names the row in button labels, such as the record's title. */
  name: string
  /** The cell for each ordinary column `id`. */
  cells: Record<string, React.ReactNode>
  /** The state of each generated column `id`. A missing entry reads as queued. */
  generated?: Record<string, GeneratedCell>
}

export type RecordsTableLabels = {
  generated: string
  queued: string
  running: string
  failed: string
  retry: string
  retryCell: (column: string, row: string) => string
  progress: (done: number, total: number) => string
}

export const defaultRecordsTableLabels: RecordsTableLabels = {
  generated: "Generated",
  queued: "Queued",
  running: "Working…",
  failed: "Failed",
  retry: "Try again",
  retryCell: (column, row) => `Try again: ${column} for ${row}`,
  progress: (done, total) => `${done} of ${total} generated cells done`,
}

export type RecordsTableProps = {
  /** Names the table for screen readers. */
  label: string
  columns: RecordsTableColumn[]
  rows: RecordsTableRow[]
  /** Passing it shows Try again in every failed cell. */
  onRetry?: (rowId: string, columnId: string) => void
  labels?: Partial<RecordsTableLabels>
  className?: string
}

/**
 * A table of records where some columns are filled in by an agent, cell by
 * cell. Each generated cell shows the state you pass for it: queued, running,
 * done with a value, or failed.
 */
function RecordsTable({
  label,
  columns,
  rows,
  onRetry,
  labels: labelsProp,
  className,
}: RecordsTableProps) {
  const labels = { ...defaultRecordsTableLabels, ...labelsProp }
  const generatedColumns = columns.filter((column) => column.isGenerated)
  const total = generatedColumns.length * rows.length
  const done = rows.reduce(
    (count, row) =>
      count +
      generatedColumns.filter((column) => row.generated?.[column.id]?.status === "done").length,
    0
  )

  return (
    <div data-slot="records-table" className={cn("flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}>
      {total > 0 && (
        // Above the table, next to the columns it counts, and announced as the
        // count changes so progress is heard without reading every cell.
        <p
          role="status"
          className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
        >
          {labels.progress(done, total)}
        </p>
      )}
      {/* The first and last cells clear the card's rounded corner, as the
          other cards inset their content. */}
      <div className={tableFrame}>
        <Table
          aria-label={label}
          className="[&_tr>*:first-child]:ps-[var(--hui-space-5)] [&_tr>*:last-child]:pe-[var(--hui-space-5)]"
        >
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} scope="col">
                  {column.isGenerated ? (
                    // A separator and a lighter weight keep the marker from
                    // reading as part of the column name.
                    <span className="inline-flex flex-wrap items-baseline gap-x-[var(--hui-space-2)]">
                      <span>{column.header}</span>
                      <span className="inline-flex items-baseline gap-x-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-regular)]">
                        <span aria-hidden="true">·</span>
                        {labels.generated}
                      </span>
                    </span>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.id} data-generated={column.isGenerated ? "" : undefined}>
                    {column.isGenerated ? (
                      <GeneratedCellContent
                        cell={row.generated?.[column.id] ?? { status: "queued" }}
                        labels={labels}
                        retryLabel={labels.retryCell(column.header, row.name)}
                        onRetry={onRetry ? () => onRetry(row.id, column.id) : undefined}
                      />
                    ) : (
                      row.cells[column.id]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function GeneratedCellContent({
  cell,
  labels,
  retryLabel,
  onRetry,
}: {
  cell: GeneratedCell
  labels: RecordsTableLabels
  retryLabel: string
  onRetry?: () => void
}) {
  if (cell.status === "done") return <>{cell.value}</>

  if (cell.status === "error") {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-2)]">
        <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
          aria-hidden="true"
          className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
        />
        <span className="min-w-0 break-words">{cell.message ?? labels.failed}</span>
        {onRetry && (
          // The negative block margin keeps the 24px button inside the 20px
          // line, so a failed cell does not make its row taller.
          <Button
            variant="secondary"
            size="xs"
            aria-label={retryLabel}
            onClick={onRetry}
            className="-my-[var(--hui-space-1)]"
          >
            {labels.retry}
          </Button>
        )}
      </span>
    )
  }

  // Working is louder than Queued, so the cell that is running stands out.
  return cell.status === "running" ? (
    <span className="flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]">
      <LoaderCircleIcon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin"
      />
      {labels.running}
    </span>
  ) : (
    <span className="text-[var(--hui-color-foreground-base-secondary)]">{labels.queued}</span>
  )
}

export { RecordsTable }
