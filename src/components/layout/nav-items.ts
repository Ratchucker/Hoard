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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean; // shown in mobile bottom nav
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/collection", label: "Collection", icon: Layers, primary: true },
  { href: "/sales", label: "Sales", icon: Receipt, primary: true },
  { href: "/activity", label: "Activity", icon: Activity, primary: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, primary: true },
  { href: "/grading", label: "Grading", icon: Award },
  { href: "/lots", label: "Lots", icon: Boxes },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/opportunity", label: "Opportunity Calculator", icon: Calculator },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((n) => n.primary);
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((n) => !n.primary);
