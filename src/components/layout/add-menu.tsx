"use client";

import Link from "next/link";
import { Plus, ShoppingCart, PackagePlus, DollarSign, Receipt, ArrowLeftRight, Boxes, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACTIONS = [
  { href: "/collection/new", label: "Buy item", icon: ShoppingCart, description: "Record a new purchase" },
  { href: "/collection/new?mode=existing", label: "Add existing item", icon: PackagePlus, description: "Already own it, no new purchase" },
  { href: "/sales/new", label: "Record sale", icon: DollarSign, description: "Mark an item as sold" },
  { href: "/expenses/new", label: "Add expense", icon: Receipt, description: "Item or general expense" },
  { href: "/trades/new", label: "Record trade", icon: ArrowLeftRight, description: "Log a card-for-card trade" },
  { href: "/lots/new", label: "Add lot purchase", icon: Boxes, description: "Buy a collection/lot" },
  { href: "/import", label: "Import collection", icon: Upload, description: "Bring in data via CSV" },
];

export function AddMenu({ variant = "default" }: { variant?: "default" | "fab" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "fab" ? (
          <Button
            variant="accent"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg shadow-brand/30"
            aria-label="Add card"
          >
            <Plus className="size-6" />
          </Button>
        ) : (
          <Button variant="accent" className="w-full gap-1.5 justify-center">
            <Plus className="size-4" />
            Add Card
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Add to your portfolio</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTIONS.map((action) => (
          <DropdownMenuItem key={action.href} asChild className="py-2.5">
            <Link href={action.href} className="flex items-start gap-3">
              <action.icon className="size-4 mt-0.5 text-muted-foreground" />
              <span className="flex flex-col">
                <span className="text-sm font-medium leading-none">{action.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{action.description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
