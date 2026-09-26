import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminSection, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoReports } from "@/lib/admin/demo-data";

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation Center — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo moderation preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminModeration,
});

const tabs = ["Reports", "Muted", "Banned", "Warnings", "Room Actions", "Moderation History"];
const concepts = ["kick", "mute", "ban", "warn", "ghost", "room mute", "room block", "moderation history"];

function AdminModeration() {
  return (
    <>
      <AdminPageHeader title="Moderation" description="Report queue and moderation concepts mirrored from the existing chat system. Nothing here changes live moderation state." />
      <DemoBanner text="Moderation actions are not connected. CodyChat moderation internals remain untouched." />

      <AdminSection title="Moderation workspace">
        <div className="p-4">
          <Tabs defaultValue="Reports">
            <TabsList className="flex flex-wrap">{tabs.map((tab) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}</TabsList>
            <TabsContent value="Reports">
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[720px]">
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Reason</TableHead><TableHead>Reporter</TableHead><TableHead>Time</TableHead><TableHead>Priority</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {demoReports.map((report) => (
                      <TableRow key={report.user + report.time}>
                        <TableCell className="font-medium">{report.user}</TableCell>
                        <TableCell className="text-muted-foreground">{report.reason}</TableCell>
                        <TableCell className="text-muted-foreground">{report.reporter}</TableCell>
                        <TableCell className="text-muted-foreground">{report.time}</TableCell>
                        <TableCell><AdminStatus tone={report.priority === "High" ? "danger" : report.priority === "Medium" ? "warning" : "neutral"}>{report.priority}</AdminStatus></TableCell>
                        <TableCell className="space-x-2 text-right"><Button size="sm" variant="outline">Review</Button><Button size="sm" variant="ghost">Dismiss</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            {tabs.slice(1).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{tab}</p>
                  <p className="mt-1">No data — this list will read from existing moderation records after Phase 2 wiring.</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AdminSection>

      <AdminSection title="Supported moderation concepts" description="Represented in this console; enforcement stays with the existing chat system." className="mt-4">
        <div className="flex flex-wrap gap-2 p-4">{concepts.map((concept) => <AdminStatus key={concept} tone="info">{concept}</AdminStatus>)}</div>
      </AdminSection>
    </>
  );
}
