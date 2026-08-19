"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS } from "@/components/layout/nav-items";
import { AddMenu } from "@/components/layout/add-menu";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <AddMenu variant="fab" />
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur supports-backdrop-blur:bg-card/80">
        <div className="grid grid-cols-5 h-16">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
