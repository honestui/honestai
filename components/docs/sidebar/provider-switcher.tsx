"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown } from "honestui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { AIComponentsAreaIcon, GenerativeAreaIcon } from "./library-area-icons";

const areas = [
  {
    name: "AI Components",
    description: "Chat and agent interfaces",
    href: "/docs",
    icon: AIComponentsAreaIcon,
  },
  {
    name: "Generative UI",
    description: "Stream structured interfaces",
    href: "/docs/generative",
    icon: GenerativeAreaIcon,
  },
];
export function ProviderSwitcher() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const active =
    pathname === "/docs/generative" || pathname.startsWith("/docs/generative/")
      ? areas[1]
      : areas[0];
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Library: ${active.name}`}
            render={
              <SidebarMenuButton
                size="lg"
                className="border border-border/60 data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <active.icon className="size-7!" />
            <span className="ml-0.5 grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {active.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {active.description}
              </span>
            </span>
            <ChevronDown aria-hidden className="ml-auto size-4 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="bg-background w-(--anchor-width)"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Library
              </DropdownMenuLabel>
              {areas.map((area) => (
                <DropdownMenuItem
                  key={area.href}
                  className="gap-2.5 p-2"
                  render={
                    <Link
                      href={area.href}
                      aria-current={area === active ? "page" : undefined}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    />
                  }
                >
                  <area.icon className="size-7" />
                  <span className="ml-0.5 grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm">{area.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {area.description}
                    </span>
                  </span>
                  {area === active && (
                    <Check className="size-3.5" aria-hidden />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
