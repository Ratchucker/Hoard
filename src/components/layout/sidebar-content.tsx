"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_GROUP_LABELS } from "@/components/layout/nav-items";
import { AddMenu } from "@/components/layout/add-menu";
import { LogoMark } from "@/components/logo";

/** Shared branded nav content — used by the desktop sidebar and the mobile nav sheet. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0B132B]">
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-brand text-brand-foreground shrink-0">
          <LogoMark className="size-4.5" />
        </div>
        <span className="font-serif text-[19px] font-semibold tracking-tight text-white">Collectfolio</span>
      </div>

      <div className="px-4 pb-4">
        <AddMenu />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.09em] text-white/35">
              {NAV_GROUP_LABELS[group]}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-brand" />
                    )}
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-white/30">Demo data · Local device only</div>
    </div>
  );
}
