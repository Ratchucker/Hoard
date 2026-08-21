import {
  LayoutDashboard,
  Layers,
  Receipt,
  Activity,
  BarChart3,
  Award,
  Boxes,
  ArrowLeftRight,
  Heart,
  Calculator,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "overview" | "tools" | "manage";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean; // shown in mobile bottom nav
  group: NavGroup;
}

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  overview: "Overview",
  tools: "Collection Tools",
  manage: "Manage",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true, group: "overview" },
  { href: "/collection", label: "Collection", icon: Layers, primary: true, group: "overview" },
  { href: "/sales", label: "Sales", icon: Receipt, primary: true, group: "overview" },
  { href: "/activity", label: "Activity", icon: Activity, primary: true, group: "overview" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, primary: true, group: "overview" },
  { href: "/grading", label: "Grading", icon: Award, group: "tools" },
  { href: "/lots", label: "Lots", icon: Boxes, group: "tools" },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight, group: "tools" },
  { href: "/wishlist", label: "Wishlist", icon: Heart, group: "tools" },
  { href: "/opportunity", label: "Opportunity Calculator", icon: Calculator, group: "tools" },
  { href: "/import", label: "Import", icon: Upload, group: "manage" },
  { href: "/settings", label: "Settings", icon: Settings, group: "manage" },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((n) => n.primary);
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((n) => !n.primary);

export const NAV_GROUPS: { group: NavGroup; items: NavItem[] }[] = (
  ["overview", "tools", "manage"] as NavGroup[]
).map((group) => ({ group, items: NAV_ITEMS.filter((n) => n.group === group) }));
