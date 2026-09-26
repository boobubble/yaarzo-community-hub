import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ActionButton, AdminPageHeader, AdminSection, AdminStatus } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { useProfilesDirectory } from "@/lib/profiles/use-profiles-directory";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Yaarzo Admin" },
      { name: "description", content: "Read-only Yaarzo user directory for administrators." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsers,
});

const actions = ["View Profile", "Edit User", "Open DM", "Adjust Coins", "Adjust XP", "Assign Role", "Mute", "Suspend", "Ban", "View History"];

const ALL = "__all__";

const READABLE_LIGHT_INPUT =
  "border-input bg-white pl-9 text-slate-900 placeholder:text-slate-500 caret-slate-900 focus-visible:ring-ring";

function UserAvatar({ username, avatar_url, avatar_color }: Pick<DirectoryProfile, "username" | "avatar_url" | "avatar_color">) {
  const initials = (username.trim().slice(0, 2) || "?").toUpperCase();
  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        className="size-8 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span
      className="brand-mark flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-primary-foreground"
      style={avatar_color ? { backgroundColor: avatar_color } : undefined}
    >
      {initials}
    </span>
  );
}

function formatLastSeen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const normalized = status.toLowerCase();
  if (normalized.includes("ban")) return "danger";
  if (normalized.includes("suspend") || normalized.includes("mute")) return "warning";
  if (normalized.includes("active")) return "success";
  return "neutral";
}

function displayRoleForUser(
  rolesByUserId: Record<string, string[]>,
  userId: string,
  rolesQueryFailed: boolean,
): string {
  if (rolesQueryFailed) return "—";
  const roles = rolesByUserId[userId];
  if (!roles?.length) return "Member";
  if (roles.includes("super_admin")) return "Super admin";
  if (roles.includes("admin")) return "Admin";
  return roles[0].replace(/_/g, " ");
}

function AdminUsers() {
  const { profiles, loading, error } = useProfilesDirectory(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [countryFilter, setCountryFilter] = useState(ALL);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string[]>>({});
  const [rolesQueryFailed, setRolesQueryFailed] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (cancelled) return;
      if (rolesError) {
        setRolesQueryFailed(true);
        setRolesByUserId({});
        setRolesLoaded(true);
        return;
      }
      const map: Record<string, string[]> = {};
      for (const row of data ?? []) {
        if (!map[row.user_id]) map[row.user_id] = [];
        map[row.user_id].push(row.role);
      }
      setRolesQueryFailed(false);
      setRolesByUserId(map);
      setRolesLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allProfiles = useMemo(
    () => Object.values(profiles).sort((a, b) => a.username.localeCompare(b.username)),
    [profiles],
  );

  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const genders = new Set<string>();
    const countries = new Set<string>();
    for (const profile of allProfiles) {
      if (profile.status) statuses.add(profile.status);
      if (profile.gender) genders.add(profile.gender);
      if (profile.country_code) countries.add(profile.country_code);
    }
    return {
      statuses: [...statuses].sort((a, b) => a.localeCompare(b)),
      genders: [...genders].sort((a, b) => a.localeCompare(b)),
      countries: [...countries].sort((a, b) => a.localeCompare(b)),
    };
  }, [allProfiles]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allProfiles.filter((profile) => {
      const username = (profile.username ?? "").toLowerCase();
      if (query && !username.includes(query)) return false;
      if (statusFilter !== ALL && profile.status !== statusFilter) return false;
      if (genderFilter !== ALL && (profile.gender ?? "") !== genderFilter) return false;
      if (countryFilter !== ALL && (profile.country_code ?? "") !== countryFilter) return false;
      return true;
    });
  }, [allProfiles, search, statusFilter, genderFilter, countryFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== ALL || genderFilter !== ALL || countryFilter !== ALL;

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Read-only directory from profiles_directory. Search and filters run in the browser; account actions remain disabled in Phase 2A."
        actions={
          <Button className="accent-button" disabled>
            Invite Staff
          </Button>
        }
      />
      <AdminSection
        title="All accounts"
        description={
          loading
            ? "Loading profiles…"
            : error
              ? "Could not load profiles"
              : `${allProfiles.length} profile${allProfiles.length === 1 ? "" : "s"}`
        }
      >
        <div className="flex flex-col gap-2 border-b bg-muted/20 p-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search users by username"
              placeholder="Search by username…"
              className={READABLE_LIGHT_INPUT}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={loading && allProfiles.length === 0}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading || Boolean(error)}>
            <SelectTrigger className="w-full bg-background sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {filterOptions.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter} disabled={loading || Boolean(error)}>
            <SelectTrigger className="w-full bg-background sm:w-36">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All genders</SelectItem>
              {filterOptions.genders.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter} disabled={loading || Boolean(error)}>
            <SelectTrigger className="w-full bg-background sm:w-36">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All countries</SelectItem>
              {filterOptions.countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center px-6 text-sm text-muted-foreground">
            Loading user profiles…
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <h2 className="font-display text-base font-semibold">Could not load profiles</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <h2 className="font-display text-base font-semibold">No profiles yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              profiles_directory returned no rows. New community accounts will appear here when profiles exist.
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <h2 className="font-display text-base font-semibold">No matching users</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Try clearing search or filters to see more accounts."
                : "No accounts match the current criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar username={profile.username} avatar_url={profile.avatar_url} avatar_color={profile.avatar_color} />
                        <span className="font-medium">{profile.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatus tone={statusTone(profile.status)}>{profile.status}</AdminStatus>
                    </TableCell>
                    <TableCell>{profile.level}</TableCell>
                    <TableCell>{profile.xp.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{profile.gender ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{profile.country_code ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatLastSeen(profile.last_seen)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rolesLoaded ? displayRoleForUser(rolesByUserId, profile.id, rolesQueryFailed) : "…"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <span>
                            <ActionButton />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{profile.username}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {actions.map((action) => (
                            <DropdownMenuItem key={action} disabled>
                              {action}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminSection>
    </>
  );
}
