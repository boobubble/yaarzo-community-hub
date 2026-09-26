import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "System Health — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo system status preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSystem,
});

const services = ["Yaarzo App", "Supabase", "CodyChat", "Database", "Realtime", "Storage"];

function AdminSystem() {
  return (
    <>
      <AdminPageHeader title="System Health" description="Service status board. No monitoring source is connected, so every service reports an unknown state." />
      <DemoBanner text="No monitoring integration exists yet. Status values below are not measurements." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card className="premium-panel rounded-lg" key={service}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">{service}</p>
                <AdminStatus tone="neutral">Not connected</AdminStatus>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Status unknown — monitoring is planned for a later phase.</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded border px-1.5 py-0.5">Operational</span>
                <span className="rounded border px-1.5 py-0.5">Warning</span>
                <span className="rounded border px-1.5 py-0.5">Offline</span>
                <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-primary">Unknown</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
