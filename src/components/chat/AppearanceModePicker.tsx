import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AppearancePreference,
  ResolvedAppearance,
} from "@/lib/chatroom-appearance";

const labels: Record<AppearancePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function AppearanceModePicker({
  preference,
  resolved,
  onChange,
  compact = false,
}: {
  preference: AppearancePreference;
  resolved: ResolvedAppearance;
  onChange: (value: AppearancePreference) => void;
  compact?: boolean;
}) {
  if (compact) {
    const cycle = () => {
      const order: AppearancePreference[] = ["light", "dark", "auto"];
      const index = order.indexOf(preference);
      onChange(order[(index + 1) % order.length] ?? "light");
    };

    const Icon =
      preference === "auto"
        ? Monitor
        : resolved === "dark"
          ? Moon
          : Sun;

    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={cycle}
        className="appearance-toggle size-8 shrink-0 border-border bg-secondary/70"
        aria-label={`Appearance: ${labels[preference]}${preference === "auto" ? ` (${resolved})` : ""}`}
        title={`Appearance: ${labels[preference]}${preference === "auto" ? ` · now ${resolved}` : ""}`}
      >
        <Icon
          className={
            preference === "auto"
              ? "text-primary"
              : resolved === "dark"
                ? "text-amber"
                : "text-primary"
          }
        />
      </Button>
    );
  }

  return (
    <Select
      value={preference}
      onValueChange={(value) => onChange(value as AppearancePreference)}
    >
      <SelectTrigger
        aria-label="Appearance mode"
        className="h-8 w-full border-border bg-secondary/70 text-[9px] shadow-brand"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="auto">Auto (day / night)</SelectItem>
      </SelectContent>
    </Select>
  );
}
