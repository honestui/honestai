import { HouseIcon, SquareAddonIcon } from "@/assets/icons";

interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export const StartedOptions: SidebarOption[] = [
  { name: "Overview", url: "/docs", icon: <HouseIcon /> },
  {
    name: "Installation",
    url: "/docs/installation",
    icon: <SquareAddonIcon />,
  },
];

export const GenerativeStartedOptions: SidebarOption[] = [
  { name: "Overview", url: "/docs/generative", icon: <HouseIcon /> },
  {
    name: "Installation",
    url: "/docs/generative/installation",
    icon: <SquareAddonIcon />,
  },
];
