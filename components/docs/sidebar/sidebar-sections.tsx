"use client";

import type { Root as PageTreeRoot } from "fumadocs-core/page-tree";
import { StartedOptions } from "@/globals/constants/docs-sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import { ComponentsNavigation, StylesNavigation } from "./docs-tree-navigation";

// Styles sit outside Components because they also work without React.
export function SidebarSections({ tree }: { tree: PageTreeRoot }) {
  return (
    <>
      <RenderDefaultOptions label="Get Started" options={StartedOptions} />
      <StylesNavigation tree={tree} />
      <ComponentsNavigation tree={tree} />
    </>
  );
}
