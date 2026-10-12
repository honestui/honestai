"use client"

import * as React from "react"
import { FileText as FileTextIcon, Globe as GlobeIcon, Wrench as WrenchIcon } from "honestui/icons"

import { SidebarNav } from "@/registry/ai/sidebar-nav"

// Sample destinations and threads.
const sampleThreads = [
  { id: "t1", title: "Billing export rounding" },
  { id: "t2", title: "Staging migration plan" },
  { id: "t3", title: "Focus ring contrast" },
  { id: "t4", title: "Supplier email drafts" },
]

export default function SidebarNavDemo() {
  const [activeItem, setActiveItem] = React.useState("home")
  const [activeThread, setActiveThread] = React.useState<string | undefined>("t1")

  return (
    <div className="flex h-96 w-full max-w-lg min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)]">
      <SidebarNav
        header={<span className="[font-weight:var(--hui-font-weight-medium)]">Sample workspace</span>}
        items={[
          { id: "home", label: "Home", icon: <GlobeIcon /> },
          { id: "files", label: "Files", icon: <FileTextIcon />, badge: "12" },
          { id: "tools", label: "Tools", icon: <WrenchIcon /> },
        ]}
        activeItemId={activeItem}
        onNavigate={(itemId) => {
          setActiveItem(itemId)
          setActiveThread(undefined)
        }}
        threads={sampleThreads}
        activeThreadId={activeThread}
        onThreadSelect={setActiveThread}
        onNewChat={() => setActiveThread(undefined)}
      />
      <p className="m-0 min-w-0 flex-1 p-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
        {activeThread
          ? `Thread: ${sampleThreads.find((thread) => thread.id === activeThread)?.title}`
          : `Page: ${activeItem}`}
      </p>
    </div>
  )
}
