"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth/store";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/collection": "Collection",
  "/sales": "Sales",
  "/activity": "Activity",
  "/analytics": "Analytics",
  "/grading": "Grading Tracker",
  "/lots": "Lot Purchases",
  "/trades": "Trades",
  "/wishlist": "Wishlist",
  "/opportunity": "Opportunity Calculator",
  "/import": "Import Collection",
  "/reports": "Reports & Export",
  "/settings": "Settings",
};

function titleFor(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES).find((k) => pathname.startsWith(k + "/"));
  return match ? TITLES[match] : "Collectfolio";
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-20 h-16 border-b bg-background/80 backdrop-blur supports-backdrop-blur:bg-background/60 flex items-center gap-3 px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <LogoMark className="size-4.5" />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">Collectfolio</span>
          </div>
          <nav className="p-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-[15px] font-semibold tracking-tight flex-1 md:flex-none">{titleFor(pathname)}</h1>

      <div className="flex-1 hidden md:block" />

      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOut();
              router.push("/login");
            }}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
