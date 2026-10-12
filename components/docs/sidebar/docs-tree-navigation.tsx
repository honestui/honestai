"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getNavItemIcon } from "@/globals/functions/getNavItemIcon";
import { flattenTree, type Root as PageTreeRoot } from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";

type PageItem = ReturnType<typeof flattenTree>[number];

/**
 * Pages currently carrying the "New" badge. Keep this list ADDITIVE ONLY:
 * each entry carries the date the page launched, and the badge disappears
 * by itself once the entry is older than two weeks. Expired rows can stay;
 * nothing ever needs manual pruning.
 */
const NEW_PAGES: readonly { url: string; releasedOn: string }[] = [
  { url: "/docs/components/agent-screen", releasedOn: "2026-10-12" },
  { url: "/docs/components/approval-card", releasedOn: "2026-10-12" },
  { url: "/docs/components/artifact-panel", releasedOn: "2026-10-12" },
  { url: "/docs/components/chat-thread", releasedOn: "2026-10-12" },
  { url: "/docs/components/code-view", releasedOn: "2026-10-12" },
  { url: "/docs/components/context-cards", releasedOn: "2026-10-12" },
  { url: "/docs/components/context-meter", releasedOn: "2026-10-12" },
  { url: "/docs/components/diff-table", releasedOn: "2026-10-12" },
  { url: "/docs/components/filter-table", releasedOn: "2026-10-12" },
  { url: "/docs/components/fine-tune-card", releasedOn: "2026-10-12" },
  { url: "/docs/components/flowchart", releasedOn: "2026-10-12" },
  { url: "/docs/components/insight-cards", releasedOn: "2026-10-12" },
  { url: "/docs/components/loading-state", releasedOn: "2026-10-12" },
  { url: "/docs/components/markdown", releasedOn: "2026-10-12" },
  { url: "/docs/components/prompt-bar", releasedOn: "2026-10-12" },
  { url: "/docs/components/recommendation-card", releasedOn: "2026-10-12" },
  { url: "/docs/components/records-table", releasedOn: "2026-10-12" },
  { url: "/docs/components/search-list", releasedOn: "2026-10-12" },
  { url: "/docs/components/selection-actions", releasedOn: "2026-10-12" },
  { url: "/docs/components/sidebar-nav", releasedOn: "2026-10-12" },
  { url: "/docs/components/streaming-text", releasedOn: "2026-10-12" },
  { url: "/docs/components/task-rows", releasedOn: "2026-10-12" },
  { url: "/docs/components/thinking-state", releasedOn: "2026-10-12" },
  { url: "/docs/components/tool-chips", releasedOn: "2026-10-12" },
];

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const NEW_PAGE_DATES = new Map(NEW_PAGES.map((page) => [page.url, page.releasedOn]));

function isRecentlyReleased(url: string): boolean {
  const releasedOn = NEW_PAGE_DATES.get(url);
  if (!releasedOn) {
    return false;
  }
  return Date.now() - Date.parse(releasedOn) < NEW_WINDOW_MS;
}

function PageGroup({ label, pages }: { label: string; pages: PageItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (pages.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {pages.map((page) => {
          const isActive = pathname === page.url;
          const isNew = isRecentlyReleased(page.url);
          const icon = page.icon ?? getNavItemIcon(page.url);

          return (
            <SidebarMenuItem key={page.url}>
              <SidebarMenuButton
                render={
                  <Link
                    href={page.url}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  />
                }
                className={cn(
                  !isActive &&
                    "text-muted-foreground/90 hover:text-primary dark:text-muted-foreground/80 dark:hover:text-primary",
                )}
                isActive={isActive}
              >
                {icon}
                <span className="min-w-0 truncate">{page.name}</span>
                {isNew && (
                  <Badge className="ms-auto" size="micro" variant="neutral">
                    New
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function ComponentsNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);
  const componentPages = useMemo(
    () => pages.filter((page) => page.url.startsWith("/docs/components/")),
    [pages],
  );

  return <PageGroup label="Components" pages={componentPages} />;
}

export function StylesNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(
    () => flattenTree(tree.children).filter((page) => page.url === "/docs/prose"),
    [tree.children],
  );

  return <PageGroup label="Styles" pages={pages} />;
}
