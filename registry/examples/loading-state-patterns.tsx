import { LoadingState } from "@/registry/ai/loading-state"

export default function LoadingStatePatternsExample() {
  return (
    <div className="flex flex-col gap-[var(--hui-space-5)]">
      <LoadingState pattern="drive" label="Reading 3 files" showElapsed={false} />
      <LoadingState pattern="dots" label="Comparing totals" showElapsed={false} />
      <LoadingState pattern="orbit" label="Waiting for the test run" showElapsed={false} />
    </div>
  )
}
