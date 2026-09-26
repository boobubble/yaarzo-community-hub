import { MoreHorizontal, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-xs font-bold uppercase text-primary">Yaarzo control center</p><h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}

export function AdminSection({ title, description, children, action, className }: { title: string; description?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <Card className={cn("premium-panel overflow-hidden rounded-lg", className)}><CardHeader className="flex-row items-start justify-between space-y-0 border-b p-4 md:p-5"><div><CardTitle className="font-display text-base">{title}</CardTitle>{description && <CardDescription className="mt-1">{description}</CardDescription>}</div>{action}</CardHeader><CardContent className="p-0">{children}</CardContent></Card>;
}

export function AdminStatCard({ label, value, icon, tone = "primary", note = "Demo preview" }: { label: string; value: string; icon: ReactNode; tone?: "primary" | "pink" | "cyan" | "green" | "amber"; note?: string }) {
  const tones = { primary: "text-primary bg-primary/10", pink: "text-highlight bg-highlight/10", cyan: "text-cyan bg-cyan/10", green: "text-success bg-success/10", amber: "text-amber bg-amber/10" };
  return <Card className="premium-panel rounded-lg"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div><div className={cn("flex size-9 items-center justify-center rounded-md", tones[tone])}>{icon}</div></div></CardContent></Card>;
}

export function AdminStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const styles = { success: "border-success/30 bg-success/10 text-success", warning: "border-amber/30 bg-amber/10 text-amber", danger: "border-alert/30 bg-alert/10 text-alert", info: "border-cyan/30 bg-cyan/10 text-cyan", neutral: "border-border bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={styles[tone]}>{children}</Badge>;
}

export function DemoBanner({ text = "Preview data — no production service is connected." }: { text?: string }) {
  return <div className="mb-5 flex items-center justify-between gap-3 rounded-md border border-amber/25 bg-amber/8 px-3 py-2 text-xs text-foreground"><span>{text}</span><AdminStatus tone="warning">UI only</AdminStatus></div>;
}

export function AdminFilterBar({ children }: { children?: ReactNode }) {
  return <div className="flex flex-col gap-2 border-b bg-muted/20 p-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Search…" className="bg-background pl-9" /></div>{children}</div>;
}

export function ActionButton() { return <Button variant="ghost" size="icon" aria-label="Open actions" title="Open actions"><MoreHorizontal /></Button>; }

export function EmptyAdminState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary"><Search /></div><h2 className="font-display text-base font-semibold">{title}</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p><AdminStatus tone="neutral">Coming in Phase 2</AdminStatus></div>;
}