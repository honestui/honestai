"use client"

import { FileText as FileTextIcon, Globe as GlobeIcon } from "honestui/icons"

import { SidebarNav } from "@/registry/ai/sidebar-nav"

export default function SidebarNavCollapsedExample() {
  return (
    <div className="flex h-64 w-full max-w-lg min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)]">
      <SidebarNav
        defaultCollapsed
        labels={{ navigation: "Workspace, collapsed example" }}
        items={[
          { id: "home", label: "Home", icon: <GlobeIcon /> },
          { id: "files", label: "Files", icon: <FileTextIcon /> },
        ]}
        activeItemId="home"
        onNavigate={() => undefined}
        threads={[]}
        onThreadSelect={() => undefined}
      />
      <p className="m-0 min-w-0 flex-1 p-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
        Collapsed, each destination keeps its name for screen readers. Expand it to see the empty
        chat list.
      </p>
    </div>
  )
}
