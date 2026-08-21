"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { AddMenu } from "@/components/layout/add-menu";
import { LogoMark } from "@/components/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card/50">
      <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
          <LogoMark className="size-4.5" />
        </div>
        <span className="font-semibold tracking-tight text-[15px]">Collectfolio</span>
      </div>

      <div className="px-4 pt-4">
        <AddMenu />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t text-xs text-muted-foreground">
        Demo data · Local device only
      </div>
    </aside>
  );
}
