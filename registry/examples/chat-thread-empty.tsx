import { ChatThread } from "@/registry/ai/chat-thread"

export default function ChatThreadEmptyExample() {
  return (
    <div className="h-56 w-full max-w-md min-w-0">
      <ChatThread
        label="New conversation"
        emptyMessage="Ask about an invoice, an export, or a failed run."
      />
    </div>
  )
}
