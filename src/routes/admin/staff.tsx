import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminSection, AdminStatus, DemoBanner } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Roles — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo staff and permission preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStaff,
});

const roles = [
  { name: "Admin", people: 3, tone: "danger" as const },
  { name: "Moderator", people: 11, tone: "warning" as const },
  { name: "Room Moderator", people: 24, tone: "info" as const },
  { name: "Support", people: 5, tone: "success" as const },
];

const permissionGroups = [
  { group: "Users", items: ["View users", "Edit users", "Suspend users", "Ban users"] },
  { group: "Chatrooms", items: ["Create rooms", "Edit rooms", "Delete rooms"] },
  { group: "Moderation", items: ["Review reports", "Apply mutes", "Apply bans"] },
  { group: "Content", items: ["Publish posts", "Remove posts"] },
  { group: "Competitions", items: ["Create competitions", "Declare winners"] },
  { group: "Wallet", items: ["Adjust coins", "Issue rewards"] },
  { group: "Settings", items: ["Feature controls", "Branding"] },
];

function AdminStaff() {
  return (
    <>
      <AdminPageHeader title="Staff & Roles" description="Role overview and a granular permission editor. Authorization rules are unchanged in Phase 1." actions={<Button className="accent-button" disabled>Save — Not connected</Button>} />
      <DemoBanner />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {roles.map((role) => (
          <Card className="premium-panel rounded-lg" key={role.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between"><p className="font-display font-semibold">{role.name}</p><AdminStatus tone={role.tone}>Role</AdminStatus></div>
              <p className="mt-3 text-2xl font-bold">{role.people}</p>
              <p className="text-[11px] text-muted-foreground">Preview member count</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {permissionGroups.map((group) => (
          <AdminSection key={group.group} title={group.group} description="Granular permission switches">
            <ul className="divide-y">
              {group.items.map((item) => (
                <li className="flex items-center justify-between gap-3 px-4 py-3" key={item}>
                  <span className="text-sm">{item}</span>
                  <Switch aria-label={item} />
                </li>
              ))}
            </ul>
          </AdminSection>
        ))}
      </div>
    </>
  );
}
