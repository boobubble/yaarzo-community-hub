import { createFileRoute } from "@tanstack/react-router";
import { Activity, Coins, Flag, MessageSquareText, Sparkles, Trophy, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { AdminPageHeader, AdminSection, AdminStatCard, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoActivity, demoGrowth, demoReports, demoRooms } from "@/lib/admin/demo-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Yaarzo Control Center" },
      { name: "description", content: "Internal Yaarzo administration dashboard preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

const quickActions = ["Create Chatroom", "Find User", "Review Reports", "Create Competition", "Add Sticker", "Send Announcement"];

function AdminDashboard() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const series = demoGrowth[range] ?? [];
  const peak = Math.max(...series);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Community health at a glance. Every figure below is preview data until backend wiring lands in Phase 2."
        actions={<Button className="accent-button">Send Announcement</Button>}
      />
      <DemoBanner />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard label="Total Users" value="18,420" tone="primary" icon={<Users className="size-4" />} />
        <AdminStatCard label="Online Users" value="642" tone="green" icon={<Activity className="size-4" />} />
        <AdminStatCard label="Guests Online" value="188" tone="cyan" icon={<UserPlus className="size-4" />} />
        <AdminStatCard label="Active Chatrooms" value="24" tone="pink" icon={<MessageSquareText className="size-4" />} />
        <AdminStatCard label="Messages Today" value="96,318" tone="amber" icon={<MessageSquareText className="size-4" />} />
        <AdminStatCard label="New Users Today" value="214" tone="green" icon={<UserPlus className="size-4" />} />
        <AdminStatCard label="Open Reports" value="12" tone="pink" icon={<Flag className="size-4" />} />
        <AdminStatCard label="Active Competitions" value="3" tone="cyan" icon={<Trophy className="size-4" />} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <AdminSection title="User Growth" description="Registrations over the selected window." className="xl:col-span-2" action={
          <Tabs value={range} onValueChange={(value) => setRange(value as typeof range)}>
            <TabsList><TabsTrigger value="7d">7 Days</TabsTrigger><TabsTrigger value="30d">30 Days</TabsTrigger><TabsTrigger value="90d">90 Days</TabsTrigger></TabsList>
          </Tabs>
        }>
          <div className="flex h-56 items-end gap-3 p-5">
            {series.map((value, index) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={index}>
                <div className="accent-button w-full rounded-t-md" style={{ height: `${(value / peak) * 160}px` }} />
                <span className="text-[11px] text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="Live Platform Activity" description="Recent community events.">
          <ul className="divide-y">
            {demoActivity.map((item) => (
              <li className="flex items-center justify-between gap-3 px-4 py-3" key={item.text}>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{item.text}</p><p className="text-[11px] text-muted-foreground">{item.time}</p></div>
                <AdminStatus tone={item.tone}>Event</AdminStatus>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <AdminSection title="Chatroom Overview" description="Room load and status snapshot.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Online</TableHead><TableHead>Messages</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {demoRooms.map((room) => (
                  <TableRow key={room.name}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.online}</TableCell>
                    <TableCell>{room.messages.toLocaleString()}</TableCell>
                    <TableCell><AdminStatus tone={room.status === "Active" ? "success" : room.status === "Quiet" ? "info" : "warning"}>{room.status}</AdminStatus></TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm">Open</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminSection>

        <AdminSection title="Moderation Queue" description="Reports waiting for a decision.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Reason</TableHead><TableHead>Reporter</TableHead><TableHead>Priority</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {demoReports.map((report) => (
                  <TableRow key={report.user + report.time}>
                    <TableCell className="font-medium">{report.user}</TableCell>
                    <TableCell className="text-muted-foreground">{report.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{report.reporter}</TableCell>
                    <TableCell><AdminStatus tone={report.priority === "High" ? "danger" : report.priority === "Medium" ? "warning" : "neutral"}>{report.priority}</AdminStatus></TableCell>
                    <TableCell className="space-x-2 text-right"><Button size="sm" variant="outline">Review</Button><Button size="sm" variant="ghost">Dismiss</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminSection>
      </div>

      <AdminSection title="Quick Actions" description="Shortcuts for daily community management." className="mt-4">
        <div className="flex flex-wrap gap-2 p-4">
          {quickActions.map((action) => (
            <Button key={action} variant="outline" className="gap-2"><Sparkles className="size-4 text-highlight" />{action}</Button>
          ))}
          <Button variant="outline" className="gap-2"><Coins className="size-4 text-amber" />Adjust Coins</Button>
        </div>
      </AdminSection>
    </>
  );
}
