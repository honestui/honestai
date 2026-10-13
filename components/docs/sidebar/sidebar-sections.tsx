"use client";

import {
  flattenTree,
  type Root as PageTreeRoot,
} from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import {
  StartedOptions,
  GenerativeStartedOptions,
} from "@/globals/constants/docs-sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import {
  ComponentsNavigation,
  StylesNavigation,
  PageGroup,
} from "./docs-tree-navigation";
import { ProviderSwitcher } from "./provider-switcher";

export function SidebarSections({ tree }: { tree: PageTreeRoot }) {
  const pathname = usePathname();
  const generative =
    pathname === "/docs/generative" || pathname.startsWith("/docs/generative/");
  const pages = flattenTree(tree.children);
  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden">
        <ProviderSwitcher />
      </div>
      <RenderDefaultOptions
        label="Get Started"
        options={generative ? GenerativeStartedOptions : StartedOptions}
      />
      {generative ? (
        <>
          <PageGroup
            label="Components"
            pages={pages.filter((page) =>
              ["/docs/generative/renderer", "/docs/generative/chat"].includes(
                page.url,
              ),
            )}
          />
          <PageGroup
            label="Guides"
            pages={pages.filter((page) =>
              ["/docs/generative/examples", "/docs/generative/language", "/docs/generative/state", "/docs/generative/tools"].includes(page.url),
            )}
          />
          <PageGroup
            label="Documentation"
            pages={pages.filter((page) =>
              ["/docs/generative/library", "/docs/generative/server"].includes(
                page.url,
              ),
            )}
          />
        </>
      ) : (
        <>
          <StylesNavigation tree={tree} />
          <ComponentsNavigation tree={tree} />
        </>
      )}
    </>
  );
}
