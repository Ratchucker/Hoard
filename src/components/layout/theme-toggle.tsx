"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-mismatch guard for next-themes
    setMounted(true);
  }, []);

  if (!mounted) return <Button variant="ghost" size="icon" className="size-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4.5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all absolute" />
      <Moon className="size-4.5 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
    </Button>
  );
}
