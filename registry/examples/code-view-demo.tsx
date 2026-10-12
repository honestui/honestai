import { CodeView } from "@/registry/ai/code-view"

const sampleCode = `function exportTotal(rows: Row[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}`

export default function CodeViewDemo() {
  return (
    <div className="w-full max-w-md min-w-0">
      <CodeView filename="export.ts" code={sampleCode} />
    </div>
  )
}
