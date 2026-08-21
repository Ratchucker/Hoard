"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Store, Plug, ScanLine } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = ["USD", "EUR", "GBP", "NZD", "AUD", "CAD", "JPY"];
const INTEGRATIONS = ["Collectr", "TCGplayer", "CollX"];

export default function SettingsPage() {
  return (
    <LoadingGate>
      <SettingsContent />
    </LoadingGate>
  );
}

function SettingsContent() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const { setTheme } = useTheme();
  const marketplaces = useStore((s) => s.marketplaces);
  const addMarketplace = useStore((s) => s.addMarketplace);
  const updateMarketplace = useStore((s) => s.updateMarketplace);
  const deleteMarketplace = useStore((s) => s.deleteMarketplace);

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pct, setPct] = React.useState("0");
  const [fixed, setFixed] = React.useState("0");
  const [priceChartingConfigured, setPriceChartingConfigured] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    fetch("/api/pricecharting/status")
      .then((r) => r.json())
      .then((d) => setPriceChartingConfigured(Boolean(d.configured)))
      .catch(() => setPriceChartingConfigured(false));
  }, []);

  function handleAddMarketplace() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    addMarketplace({ name: name.trim(), percentageFee: Number(pct) || 0, fixedFee: Number(fixed) || 0, feesEnabled: true, isDefault: false });
    toast.success("Marketplace added");
    setName(""); setPct("0"); setFixed("0");
    setOpen(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Configure marketplaces, currency, and thresholds." />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">General</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Base currency</Label>
            <Select value={settings.baseCurrency} onValueChange={(v) => updateSettings({ baseCurrency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={(v) => { updateSettings({ theme: v as typeof settings.theme }); setTheme(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Slow Mover Thresholds</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Flag items held longer than (days)</Label>
            <Input type="number" min={0} value={settings.slowMoverDaysThreshold} onChange={(e) => updateSettings({ slowMoverDaysThreshold: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>AND ROI below (%)</Label>
            <Input type="number" value={settings.slowMoverRoiThreshold} onChange={(e) => updateSettings({ slowMoverRoiThreshold: Number(e.target.value) || 0 })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Store className="size-4" />Marketplace Fee Presets</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1"><Plus className="size-3.5" />Add marketplace</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add marketplace</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Percentage fee %</Label><Input type="number" step="0.01" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Fixed fee</Label><Input type="number" step="0.01" value={fixed} onChange={(e) => setFixed(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMarketplace}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Fees are estimates, not permanent assumptions — override them on any individual sale.
          </p>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketplace</TableHead>
                  <TableHead className="text-right">% Fee</TableHead>
                  <TableHead className="text-right">Fixed Fee</TableHead>
                  <TableHead className="text-right">Enabled</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketplaces.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm font-medium">{m.name} {m.isDefault && <Badge variant="outline" className="ml-1.5">Default</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20 h-8 ml-auto text-right"
                        value={m.percentageFee}
                        onChange={(e) => updateMarketplace(m.id, { percentageFee: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20 h-8 ml-auto text-right"
                        value={m.fixedFee}
                        onChange={(e) => updateMarketplace(m.id, { fixedFee: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch checked={m.feesEnabled} onCheckedChange={(v) => updateMarketplace(m.id, { feesEnabled: v })} />
                    </TableCell>
                    <TableCell>
                      <button onClick={() => deleteMarketplace(m.id)} className="text-muted-foreground hover:text-red-500">
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Plug className="size-4" />Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Live price and collection sync integrations are placeholders for future API integrations, except PriceCharting,
            which is wired up and ready for an API key.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground shrink-0">
                  <ScanLine className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">PriceCharting</p>
                  <p className="text-xs text-muted-foreground">
                    {priceChartingConfigured === null
                      ? "Checking…"
                      : priceChartingConfigured
                        ? "Live pricing + images available from the item detail page."
                        : "Add PRICECHARTING_API_KEY to your environment to go live."}
                  </p>
                </div>
              </div>
              {priceChartingConfigured === null ? (
                <Badge variant="outline">Checking…</Badge>
              ) : priceChartingConfigured ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="outline">Demo mode</Badge>
              )}
            </div>
            {INTEGRATIONS.map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{i}</span>
                <Badge variant="outline">Not connected</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
