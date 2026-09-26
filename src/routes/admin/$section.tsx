import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader, AdminSection, EmptyAdminState } from "@/components/admin/admin-ui";

export const Route = createFileRoute("/admin/$section")({
  head: ({ params }) => {
    const title = titleFor(params.section);
    return {
      meta: [
        { title: `${title} — Yaarzo Admin` },
        { name: "description", content: `Internal Yaarzo ${title.toLowerCase()} administration area.` },
        { name: "robots", content: "noindex, nofollow" },
        { name: "googlebot", content: "noindex, nofollow" },
      ],
    };
  },
  component: AdminSectionShell,
});

function titleFor(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AdminSectionShell() {
  const { section } = Route.useParams();
  const title = titleFor(section);

  return (
    <>
      <AdminPageHeader title={title} description={`${title} management will be built on top of this console once its data source is approved.`} />
      <AdminSection title={`${title} workspace`} description="Reserved area — intentionally empty in Phase 1.">
        <EmptyAdminState title="Nothing connected yet" description={`No ${title.toLowerCase()} data source is wired to the admin console. This page holds the layout so navigation stays complete.`} />
      </AdminSection>
    </>
  );
}
