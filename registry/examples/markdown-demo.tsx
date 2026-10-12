"use client"

import * as React from "react"

import { Markdown } from "@/registry/ai/markdown"
import { StreamingText, useSmoothStream } from "@/registry/ai/streaming-text"

// Sample reply.
const sampleReply = `Rounding each row **before** the sum is what causes the drift. Three rows of 0.336 show it:

| Approach | Total |
| --- | --- |
| Round each row, then sum | 1.02 |
| Sum, then round once | 1.01 |

To fix the export:

1. Sum the raw amounts.
2. Round the total once, with \`roundTotal\`.

\`\`\`ts
function exportTotal(rows: Row[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}
\`\`\`
`

// Cut into uneven pieces, so syntax arrives half-written as it does from a model.
const sampleChunks = sampleReply.match(/[\s\S]{1,23}/g) ?? []

const CHUNK_MILLISECONDS = 160

/**
 * No model streams into this preview. A timer delivers the sample reply a
 * piece at a time, and Markdown renders whatever has arrived. Try again
 * restarts the timer.
 */
export default function MarkdownDemo() {
  const [chunkCount, setChunkCount] = React.useState(0)
  const hasAllChunks = chunkCount >= sampleChunks.length
  const stream = useSmoothStream(sampleChunks.slice(0, chunkCount).join(""), {
    charactersPerSecond: 160,
  })
  const isComplete = hasAllChunks && stream.isSettled

  React.useEffect(() => {
    if (hasAllChunks) return
    const timer = window.setTimeout(() => setChunkCount((count) => count + 1), CHUNK_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [chunkCount, hasAllChunks])

  return (
    <div className="w-full max-w-md min-w-0">
      <StreamingText
        status={isComplete ? "complete" : "streaming"}
        // Paced text changes many times a second, which is too much to announce.
        announce={false}
        copyText={sampleReply}
        onRetry={() => setChunkCount(0)}
      >
        <Markdown isStreaming={!isComplete}>{stream.text}</Markdown>
      </StreamingText>
    </div>
  )
}
