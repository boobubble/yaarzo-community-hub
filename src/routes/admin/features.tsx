import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminSection, DemoBanner } from "@/components/admin/admin-ui";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/features")({
  head: () => ({
    meta: [
      { title: "Feature Controls — Yaarzo Admin" },
      { name: "description", content: "Internal Yaarzo feature flag preview." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFeatures,
});

const groups = ["Chat", "Feed", "Competitions", "Confessions", "Poetry", "Communities", "Radio", "Leaderboard", "Gamification"];
const toggles = ["Enable feature", "Public visibility", "Registered-only interaction", "Maintenance mode"];

function AdminFeatures() {
  return (
    <>
      <AdminPageHeader title="Feature Controls" description="Grouped switches for every Yaarzo module. Toggles are visual only until verified settings exist." />
      <DemoBanner text="These switches do not change any live setting yet." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <AdminSection key={group} title={group} description="Module availability">
            <ul className="divide-y">
              {toggles.map((toggle) => (
                <li className="flex items-center justify-between gap-3 px-4 py-3" key={toggle}>
                  <span className="text-sm">{toggle}</span>
                  <Switch aria-label={`${group} — ${toggle}`} defaultChecked={toggle === "Enable feature"} />
                </li>
              ))}
            </ul>
          </AdminSection>
        ))}
      </div>
    </>
  );
}
