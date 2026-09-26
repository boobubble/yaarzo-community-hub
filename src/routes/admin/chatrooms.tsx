import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminSection, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoRooms } from "@/lib/admin/demo-data";

export const Route = createFileRoute("/admin/chatrooms")({
  head: () => ({
    meta: [
      { title: "Chatroom Management — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo chatroom management preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminChatrooms,
});

const roomActions = ["Open Room", "Edit", "Manage Moderators", "Room Settings", "Mute Room", "Disable", "Delete"];
const editorSections = ["General", "Access", "Moderation", "Appearance", "Bots", "Permissions"];

function AdminChatrooms() {
  return (
    <>
      <AdminPageHeader
        title="Chatrooms"
        description="Room inventory and configuration surfaces. Live CodyChat rooms are not wired into this screen yet."
        actions={
          <Dialog>
            <DialogTrigger asChild><Button className="accent-button">Create Chatroom</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create chatroom</DialogTitle><DialogDescription>Form preview only — nothing is saved in Phase 1.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Room name" />
                <Input placeholder="Short description" />
                <Input placeholder="Visibility (public / staff)" />
              </div>
              <DialogFooter><Button variant="outline">Cancel</Button><Button className="accent-button" disabled>Save — Not connected</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <DemoBanner />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {demoRooms.map((room) => (
          <Card className="premium-panel rounded-lg" key={room.name}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="brand-mark flex size-10 items-center justify-center rounded-md text-sm font-bold text-primary-foreground">{room.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.visibility} • {room.mods} moderators</p>
                </div>
                <AdminStatus tone={room.status === "Active" ? "success" : room.status === "Quiet" ? "info" : "warning"}>{room.status}</AdminStatus>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/40 p-2"><p className="text-[11px] text-muted-foreground">Online</p><p className="font-semibold">{room.online}</p></div>
                <div className="rounded-md bg-muted/40 p-2"><p className="text-[11px] text-muted-foreground">Messages</p><p className="font-semibold">{room.messages.toLocaleString()}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roomActions.map((action) => <Button key={action} size="sm" variant="outline" className="h-7 text-xs">{action}</Button>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminSection title="Room editor" description="Configuration areas prepared for Phase 2 wiring." className="mt-4">
        <div className="p-4">
          <Tabs defaultValue="General">
            <TabsList className="flex flex-wrap">{editorSections.map((section) => <TabsTrigger key={section} value={section}>{section}</TabsTrigger>)}</TabsList>
            {editorSections.map((section) => (
              <TabsContent key={section} value={section}>
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{section}</span> settings will bind to existing CodyChat room configuration once backend wiring is approved. No data is loaded or saved now.
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AdminSection>
    </>
  );
}
