"use client";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsiblePanel,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function CodeCollapsibleWrapper({
  className,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof Collapsible>) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const open = controlledOpen ?? expanded;
  return (
    <Collapsible
      className={cn("group/collapsible relative", className)}
      {...props}
      open={open}
      onOpenChange={(nextOpen, details) => {
        setExpanded(nextOpen);
        onOpenChange?.(nextOpen, details);
      }}
    >
      <CollapsiblePanel
        className="relative h-full overflow-hidden data-closed:max-h-64 [&>figure]:mt-0 [&>figure]:md:mx-0!"
        hidden={false}
        keepMounted
      >
        {children}
      </CollapsiblePanel>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-16 bg-linear-to-b from-transparent to-background group-data-open/collapsible:hidden"
      />
      <CollapsibleTrigger
        render={<Button variant="secondary" size="sm" />}
        className="absolute right-4 bottom-4"
      >
        {open ? "Collapse" : "Expand"}
      </CollapsibleTrigger>
    </Collapsible>
  );
}