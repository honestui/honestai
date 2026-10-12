"use client"

import * as React from "react"

import { ChatMessage, ChatThread } from "@/registry/ai/chat-thread"

const SEND_MILLISECONDS = 600

/**
 * Nothing is sent. The first Send is rejected after a pause, as a failed
 * request would be, and the second one goes through.
 */
export default function ChatThreadEditFailureExample() {
  const [text, setText] = React.useState("Summarize the Q3 invoices.")
  const attempts = React.useRef(0)

  return (
    <div className="h-64 w-full max-w-md min-w-0">
      <ChatThread label="Conversation with the billing agent">
        <ChatMessage
          role="user"
          author="You"
          editText={text}
          onEdit={(edited) =>
            new Promise<void>((resolve, reject) => {
              window.setTimeout(() => {
                attempts.current += 1
                if (attempts.current === 1) {
                  reject(new Error("Sample failure"))
                  return
                }
                setText(edited)
                resolve()
              }, SEND_MILLISECONDS)
            })
          }
        >
          {text}
        </ChatMessage>
      </ChatThread>
    </div>
  )
}
