"use client";

import * as React from "react";
import {
  FileText as FileTextIcon,
  Pencil as PencilIcon,
  Terminal as TerminalIcon,
} from "honestui/icons";

import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/registry/ai/chat-thread";
import { CodeView } from "@/registry/ai/code-view";
import { ContextCards } from "@/registry/ai/context-cards";
import { DiffTable, type DiffTableRow } from "@/registry/ai/diff-table";
import { Markdown } from "@/registry/ai/markdown";
import { RecommendationCard, type RecommendationOption } from "@/registry/ai/recommendation-card";
import { TaskRows, type Task } from "@/registry/ai/task-rows";
import { ThinkingState, ThinkingStep } from "@/registry/ai/thinking-state";
import { ToolChips, type FileChange, type ToolCall } from "@/registry/ai/tool-chips";

// Every sample on the landing page tells one made-up story: a billing agent
// finds out why invoice export totals are off by a cent, and fixes it.

const noteText =
  "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]";

const thinkingSteps = [
  { id: "read", label: "Reading the export module", detail: "3 files" },
  { id: "trace", label: "Tracing where totals are rounded" },
  { id: "compare", label: "Comparing against the invoice schema", detail: "12 fields" },
  { id: "plan", label: "Writing the change plan" },
];

const fixOptions: RecommendationOption[] = [
  {
    id: "round-once",
    body: "Round the total once, after the rows are summed. The export rounds each row first, which is where the cent goes.",
    summary: "Round once, after the sum",
    confidence: 3,
    confidenceLabel: "High confidence",
    actionLabel: "Apply the fix",
  },
  {
    id: "integer-cents",
    body: "Store amounts as integer cents. This removes rounding entirely, but it changes the invoice schema.",
    summary: "Store amounts as integer cents",
    confidence: 2,
    confidenceLabel: "Needs review",
    actionLabel: "Draft the migration",
  },
];

const toolCalls: ToolCall[] = [
  {
    id: "read",
    label: "Read",
    detail: "export.ts",
    detailIsCode: true,
    icon: <FileTextIcon />,
    output: [{ text: "148 lines. Totals are rounded per row, before they are summed." }],
  },
  {
    id: "edit",
    label: "Edit",
    detail: "export.ts",
    detailIsCode: true,
    icon: <PencilIcon />,
    outputIsCode: true,
    output: [
      { text: "return rows.map(roundRow).reduce(sum, 0)", kind: "removed" },
      { text: "return roundTotal(rows.reduce(sum, 0))", kind: "added" },
    ],
  },
  {
    id: "test",
    label: "Run",
    detail: "npm test -- export",
    detailIsCode: true,
    icon: <TerminalIcon />,
    outputIsCode: true,
    output: [{ text: "14 passed, 0 failed" }],
  },
];

const fileChanges: FileChange[] = [
  { path: "export.ts", added: 2, removed: 1 },
  { path: "export.test.ts", added: 6, removed: 0 },
];

// The run moves through these stages. It waits at `PROPOSED` for the person.
const PROPOSED = thinkingSteps.length;
const FINISHED = PROPOSED + toolCalls.length + 1;
const STAGE_MILLISECONDS = 800;

/**
 * One agent run built from five components. No agent or model runs it: a
 * timer completes each step, and it stops at the recommendation until the
 * person accepts an option, the way a real run waits for approval.
 */
export function AgentRunSample() {
  const [stage, setStage] = React.useState(0);
  const [accepted, setAccepted] = React.useState<string | null>(null);
  const [runKey, setRunKey] = React.useState(0);

  const isThinking = stage < PROPOSED;
  const isApplying = accepted === "round-once" && stage < FINISHED;

  React.useEffect(() => {
    if (!isThinking && !isApplying) return;
    const timer = window.setTimeout(() => setStage((current) => current + 1), STAGE_MILLISECONDS);
    return () => window.clearTimeout(timer);
  }, [stage, isThinking, isApplying]);

  // After the fix is accepted, one more tool call starts at each stage.
  const startedCalls = Math.min(stage - PROPOSED, toolCalls.length);
  const calls = toolCalls.slice(0, startedCalls).map(
    (call, index): ToolCall => ({
      ...call,
      status: index === startedCalls - 1 && stage < FINISHED ? "running" : "done",
    }),
  );

  const restart = () => {
    setStage(0);
    setAccepted(null);
    setRunKey((key) => key + 1);
  };

  return (
    // The height is reserved up to the recommendation, so the run does not
    // push the rest of the page down while it plays.
    <div className="flex min-h-[25rem] w-full min-w-0 flex-col gap-[var(--hui-space-5)] rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-5)]">
      <ChatMessage role="user" author="You">
        Why are export totals off by a cent?
      </ChatMessage>

      <ChatMessage role="assistant" author="Billing agent" hideAuthor>
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-4)]">
          <ThinkingState
            status={isThinking ? "running" : "done"}
            label={isThinking ? "Thinking" : `Finished ${thinkingSteps.length} steps`}
          >
            {thinkingSteps.slice(0, stage + 1).map((step, index) => (
              <ThinkingStep
                key={step.id}
                status={index < stage ? "done" : "running"}
                detail={step.detail}
              >
                {step.label}
              </ThinkingStep>
            ))}
          </ThinkingState>

          {!isThinking && (
            <RecommendationCard
              key={runKey}
              title="How should I fix the rounding drift?"
              options={fixOptions}
              onAccept={(option) => {
                setAccepted(option.id);
                if (option.id === "round-once") setStage(PROPOSED + 1);
              }}
            />
          )}

          {accepted === "integer-cents" && (
            <p role="status" className={noteText}>
              Your handler received “integer-cents”. This sample only plays
              out the first option.
            </p>
          )}

          {calls.length > 0 && (
            <ToolChips
              summary={calls.length === 1 ? "1 tool call" : `${calls.length} tool calls`}
              calls={calls}
              changes={stage >= FINISHED ? fileChanges : undefined}
              defaultOpen
            />
          )}

          {stage >= FINISHED && (
            <CodeView
              filename="export.ts"
              diff={[
                { text: "function exportTotal(rows: Row[]) {" },
                { text: "  return rows.map(roundRow).reduce(sum, 0)", kind: "removed" },
                { text: "  return roundTotal(rows.reduce(sum, 0))", kind: "added" },
                { text: "}" },
              ]}
            />
          )}
        </div>
      </ChatMessage>

      {!isThinking && (
        <Button variant="secondary" size="sm" disabled={isApplying} onClick={restart}>
          Run the sample again
        </Button>
      )}
    </div>
  );
}

const runTasks: Task[] = [
  {
    id: "read",
    label: "Read the export module",
    summary: "3 files",
    status: "done",
    details: [{ label: "Found per-row rounding", value: "export.ts" }],
  },
  { id: "fix", label: "Round the total once", summary: "1 file", status: "done" },
  { id: "test", label: "Run the export tests", summary: "14 tests", status: "running" },
  { id: "changelog", label: "Update the changelog", status: "error" },
  { id: "summary", label: "Write the summary", status: "queued" },
];

/** No agent runs here. Retry moves the failed task to running, as your handler would. */
export function TaskRowsSample() {
  const [tasks, setTasks] = React.useState(runTasks);

  return (
    <div className="w-full max-w-md min-w-0">
      <TaskRows
        tasks={tasks}
        onRetry={(taskId) =>
          setTasks((current) =>
            current.map((task) => (task.id === taskId ? { ...task, status: "running" } : task)),
          )
        }
      />
    </div>
  );
}

const schemaRows: DiffTableRow[] = [
  { id: "amount", change: "removed", name: "amount", cells: { column: "amount", type: "numeric(12,2)" } },
  { id: "currency", change: "unchanged", name: "currency", cells: { column: "currency", type: "text" } },
  { id: "cents", change: "added", name: "amount_cents", cells: { column: "amount_cents", type: "bigint" } },
];

/** This sample applies nothing. It shows the row ids your `onApply` receives. */
export function DiffTableSample() {
  const [applied, setApplied] = React.useState<string[] | null>(null);

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <DiffTable
        title="Proposed changes to the invoices table"
        columns={[
          { id: "column", header: "Column" },
          { id: "type", header: "Type" },
        ]}
        rows={schemaRows}
        onApply={setApplied}
      />
      <p role="status" className={noteText}>
        {applied ? `onApply received: ${applied.join(", ")}` : ""}
      </p>
    </div>
  );
}

export function ContextCardsSample() {
  return (
    <div className="w-full max-w-md min-w-0">
      <ContextCards
        title="Retrieved context"
        chunks={[
          {
            id: "rounding",
            title: "Rounding rule",
            meta: "118 characters",
            body: "Invoice totals are rounded half up to two decimal places. Round once, on the final total, never on each row.",
            source: { label: "billing-notes.md" },
          },
          {
            id: "export",
            title: "Export totals",
            meta: "96 characters",
            body: "exportTotal sums the rows of one invoice. Finance compares the result with the ledger each month.",
            source: { label: "export.ts" },
          },
        ]}
      />
    </div>
  );
}

// No heading in this sample: it would join the page's own outline.
const releaseNote = `The export fix is ready. ~~Ship on Friday~~ Ship on Monday, after the backfill.

- [x] Round the total once
- [x] Add a test for three rows of 0.336
- [ ] Backfill the affected invoices

| Rows | Before | After |
| --- | --- | --- |
| 3 × 0.336 | 1.02 | 1.01 |

> Totals already sent to customers are not changed by the backfill.
`;

/** A reply written in Markdown, framed so it reads apart from the answer around it. */
export function MarkdownSample() {
  return (
    <div className="w-full max-w-md min-w-0 rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-5)]">
      <Markdown>{releaseNote}</Markdown>
    </div>
  );
}
