import { Flowchart, FlowStep } from "@/registry/ai/flowchart"

export default function FlowchartDemo() {
  return (
    <div className="w-full max-w-md min-w-0">
      <Flowchart label="Invoice follow-up workflow">
        <FlowStep
          kind="Trigger"
          title="Invoice becomes overdue"
          caption="Runs once for each invoice, the day after its due date."
        />
        <FlowStep
          kind="If / Else"
          title="Amount is over 1,000"
          caption="Larger invoices go to a person before any email is sent."
        />
        <FlowStep kind="Action" title="Draft a reminder email" caption="Waits for approval." />
      </Flowchart>
    </div>
  )
}
