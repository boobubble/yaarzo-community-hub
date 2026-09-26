import { createFileRoute } from "@tanstack/react-router";
import { Smile, Upload } from "lucide-react";

import { AdminFilterBar, AdminPageHeader, AdminSection, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoStickerPacks } from "@/lib/admin/demo-data";

export const Route = createFileRoute("/admin/stickers")({
  head: () => ({
    meta: [
      { title: "Stickers & Emoji — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo sticker pack management preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStickers,
});

function AdminStickers() {
  return (
    <>
      <AdminPageHeader
        title="Stickers & Emoji"
        description="Pack management surface for the existing sticker system. No second sticker store is created."
        actions={<><Button variant="outline" className="gap-2"><Upload className="size-4" />Bulk upload</Button><Button className="accent-button">Create pack</Button></>}
      />
      <DemoBanner />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {demoStickerPacks.map((pack) => (
          <Card className="premium-panel rounded-lg" key={pack.name}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between"><p className="font-display font-semibold">{pack.name}</p><AdminStatus tone={pack.status === "Enabled" ? "success" : "neutral"}>{pack.status}</AdminStatus></div>
              <p className="mt-1 text-xs text-muted-foreground">{pack.count} stickers</p>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div className="flex aspect-square items-center justify-center rounded-md bg-muted/50 text-muted-foreground" key={index}><Smile className="size-4" /></div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs">Rename</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">{pack.status === "Enabled" ? "Disable" : "Enable"}</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-alert">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminSection title="Sticker library" description="Search across categories and packs." className="mt-4">
        <AdminFilterBar />
        <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-8 lg:grid-cols-12">
          {Array.from({ length: 24 }).map((_, index) => (
            <div className="flex aspect-square items-center justify-center rounded-md border bg-muted/40 text-muted-foreground" key={index}><Smile className="size-5" /></div>
          ))}
        </div>
      </AdminSection>
    </>
  );
}
