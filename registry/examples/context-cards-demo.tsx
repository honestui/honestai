import { ContextCards } from "@/registry/ai/context-cards"

export default function ContextCardsDemo() {
  return (
    <div className="w-full max-w-md min-w-0">
      <ContextCards
        title="Retrieved context"
        chunks={[
          {
            id: "focus",
            title: "Focus ring",
            meta: "212 characters",
            body: "Keyboard focus is shown with a 1px accent ring. A control on an accent fill pushes the ring out by 2px so it clears the fill.",
            source: { label: "Accessibility", href: "https://www.honestui.com/docs/accessibility" },
          },
          {
            id: "tokens",
            title: "Token naming",
            meta: "148 characters",
            body: "Semantic tokens name a role, such as the primary foreground, and resolve to a different value in each theme.",
            source: { label: "tokens-notes.md" },
          },
        ]}
      />
    </div>
  )
}
