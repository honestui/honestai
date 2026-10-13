"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Play } from "honestui/icons";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const PLAYGROUND_URL = "/docs/generative/playground";

export function PlaygroundLink() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const isGenerative =
    pathname === "/docs/generative" || pathname.startsWith("/docs/generative/");
  const isActive = pathname === PLAYGROUND_URL;

  return (
    <Button
      size="lg"
      variant="default"
      className="mb-3 h-auto w-full justify-start gap-3 px-3 py-3 text-left"
      render={
        <Link
          href={PLAYGROUND_URL}
          aria-current={isActive ? "page" : undefined}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        />
      }
    >
      <Play aria-hidden="true" fill="currentColor" className="size-4" />
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate font-medium">Playground</span>
        <span className="truncate text-xs font-normal opacity-75">
          {isGenerative ? "Chat with generated UI" : "Try AI components in chat"}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 opacity-75" />
    </Button>
  );
}
