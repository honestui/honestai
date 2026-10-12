import { StreamingText } from "@/registry/ai/streaming-text"

export default function StreamingTextStaticExample() {
  return (
    <div className="w-full max-w-md min-w-0">
      <StreamingText
        defaultSourcesOpen
        copyText="The export rounds each row before it sums them. Use roundTotal after the sum."
        sources={[{ href: "/docs/components/tool-chips", title: "Tool Chips", domain: "ai.honestui.com" }]}
      >
        <p>
          The export rounds each row before it sums them, so totals drift by a cent on long invoices.
        </p>
        <p>
          Call <code>roundTotal</code> once, after the sum:
        </p>
        <ul>
          <li>Totals match the ledger.</li>
          <li>All 14 existing tests still pass.</li>
        </ul>
      </StreamingText>
    </div>
  )
}
