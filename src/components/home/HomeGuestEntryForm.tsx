import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { codyGuestBirthDateForAgeConfirmation } from "@/lib/chat/cody-guest-login";

export function HomeGuestEntryForm({
  onJoined,
}: {
  onJoined: () => void;
}) {
  const [gender, setGender] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!ageOk) {
      setError("Please confirm you are 14 or older.");
      return;
    }

    const birthDate = codyGuestBirthDateForAgeConfirmation(ageOk);
    if (!birthDate) {
      setError("Please confirm you are 14 or older.");
      return;
    }

    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    data.set("gender", gender);
    data.set("birthDate", birthDate);

    try {
      const response = await fetch("/api/chat/guest-login", {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as {
        authenticated?: boolean;
        error?: string;
      };

      if (!response.ok || !result.authenticated) {
        setError(result.error ?? "CodyChat could not complete guest login.");
        return;
      }

      onJoined();
    } catch {
      setError("CodyChat is unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-extrabold text-[var(--home-text)]">
        Continue as Guest
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="home-guest-nickname" className="text-xs text-[var(--home-text-muted)]">
          Nickname
        </Label>
        <Input
          id="home-guest-nickname"
          name="nickname"
          placeholder="Enter your nickname"
          autoComplete="nickname"
          maxLength={64}
          required
          className="border-[var(--home-border)] bg-black/20 text-[var(--home-text)]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-[var(--home-text-muted)]">Gender</Label>
        <Select value={gender} onValueChange={setGender} required>
          <SelectTrigger className="border-[var(--home-border)] bg-black/20 text-[var(--home-text)]">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Male</SelectItem>
            <SelectItem value="2">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-left text-xs text-[var(--home-text-muted)]">
        <input
          type="checkbox"
          checked={ageOk}
          onChange={(event) => setAgeOk(event.target.checked)}
          className="mt-0.5"
        />
        Yes, I am 14 or older
      </label>
      {error ? (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="accent-button w-full gap-2"
        disabled={submitting || !gender || !ageOk}
      >
        {submitting ? "Joining…" : "Join Chatroom"}
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-[10px] leading-4 opacity-50 text-[var(--home-text-muted)]">
        No account needed.
      </p>
    </form>
  );
}
