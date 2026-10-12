import {
  ActivitySparkIcon,
  ArrowDataTransferHorizontalIcon,
  BrowserIcon,
  BubbleChatIcon,
  CardExchangeIcon,
  CheckmarkSquare02Icon,
  CommandLineIcon,
  DashboardSpeed01Icon,
  DistributeVerticalCenterIcon,
  DropdownFieldTypeIcon,
  InputLongTextIcon,
  Layers01Icon,
  LayoutTable01Icon,
  LayoutTwoColumnIcon,
  Loading03Icon,
  MagicWand01Icon,
  Menu01Icon,
  Message01Icon,
  PanelRightIcon,
  ParagraphIcon,
  SlidersHorizontalIcon,
  Table01Icon,
  TextSelectionIcon,
  ToolsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const COMPONENT_ICONS = {
  "agent-screen": BrowserIcon,
  "approval-card": CheckmarkSquare02Icon,
  "artifact-panel": LayoutTwoColumnIcon,
  "chat-thread": BubbleChatIcon,
  "code-view": CommandLineIcon,
  "context-cards": Layers01Icon,
  "context-meter": DashboardSpeed01Icon,
  "diff-table": ArrowDataTransferHorizontalIcon,
  "filter-table": LayoutTable01Icon,
  "fine-tune-card": SlidersHorizontalIcon,
  flowchart: DistributeVerticalCenterIcon,
  "insight-cards": ActivitySparkIcon,
  "loading-state": Loading03Icon,
  markdown: ParagraphIcon,
  "prompt-bar": InputLongTextIcon,
  "recommendation-card": CardExchangeIcon,
  "records-table": Table01Icon,
  "search-list": DropdownFieldTypeIcon,
  "selection-actions": TextSelectionIcon,
  "sidebar-nav": PanelRightIcon,
  "streaming-text": Message01Icon,
  "task-rows": Menu01Icon,
  "thinking-state": MagicWand01Icon,
  "tool-chips": ToolsIcon,
  prose: ParagraphIcon,
} as const;

/** The sidebar icon for a documentation page, chosen by the last segment of its URL. */
export function getNavItemIcon(url?: string) {
  const slug = url?.split("/").pop();
  const icon = COMPONENT_ICONS[slug as keyof typeof COMPONENT_ICONS];

  return icon ? <HugeiconsIcon icon={icon} strokeWidth={1.5} /> : null;
}
