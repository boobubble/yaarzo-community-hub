import { createFileRoute } from "@tanstack/react-router";

import { ActionButton, AdminFilterBar, AdminPageHeader, AdminSection, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoUsers } from "@/lib/admin/demo-data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo user management preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsers,
});

const actions = ["View Profile", "Edit User", "Open DM", "Adjust Coins", "Adjust XP", "Assign Role", "Mute", "Suspend", "Ban", "View History"];

function AdminUsers() {
  return (
    <>
      <AdminPageHeader title="Users" description="Search, filter and review community accounts. Row actions are visual only in Phase 1." actions={<Button className="accent-button">Invite Staff</Button>} />
      <DemoBanner />
      <AdminSection title="All accounts" description={`${demoUsers.length} preview records`}>
        <AdminFilterBar>
          <Select><SelectTrigger className="w-full bg-background sm:w-36"><SelectValue placeholder="Presence" /></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-full bg-background sm:w-36"><SelectValue placeholder="Account" /></SelectTrigger><SelectContent><SelectItem value="registered">Registered</SelectItem><SelectItem value="guest">Guest</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-full bg-background sm:w-36"><SelectValue placeholder="Tier" /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="creator">Creator</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-full bg-background sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="banned">Banned</SelectItem></SelectContent></Select>
        </AdminFilterBar>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                <TableHead>Level</TableHead><TableHead>Coins</TableHead><TableHead>Joined</TableHead><TableHead>Last Active</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoUsers.map((user) => (
                <TableRow key={user.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="brand-mark flex size-8 items-center justify-center rounded-md text-xs font-bold text-primary-foreground">{user.name.slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><AdminStatus tone={user.type === "Guest" ? "neutral" : user.type === "VIP" ? "warning" : "info"}>{user.type}</AdminStatus></TableCell>
                  <TableCell><AdminStatus tone={user.status === "Active" ? "success" : user.status === "Suspended" ? "warning" : "danger"}>{user.status}</AdminStatus></TableCell>
                  <TableCell>{user.level}</TableCell>
                  <TableCell>{user.coins.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{user.joined}</TableCell>
                  <TableCell className="text-muted-foreground">{user.active}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><span><ActionButton /></span></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {actions.map((action) => <DropdownMenuItem key={action} disabled>{action}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminSection>
    </>
  );
}
