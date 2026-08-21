"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signIn = useAuthStore((s) => s.signIn);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (hydrated && user) router.replace("/dashboard");
  }, [hydrated, user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    signIn(email.trim(), name.trim());
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center space-y-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground">
            <LogoMark className="size-5" />
          </div>
          <CardTitle className="text-lg">Sign in to Collectfolio</CardTitle>
          <p className="text-sm text-muted-foreground">Track profit, loss, and ROI from your collectibles.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full">Continue</Button>
            <p className="text-xs text-muted-foreground text-center">
              Demo account, stored only on this device. No password required.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
