import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type ReasonOption = { id: number; label: string };

export function ChatReportDialog({
  open,
  onOpenChange,
  postId,
  authorName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  authorName: string;
}) {
  const [reasons, setReasons] = useState<ReasonOption[]>([]);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError("");
    setReason("");
    void fetch("/api/chat/report")
      .then((r) => r.json())
      .then((json: { reasons?: ReasonOption[] }) => setReasons(json.reasons ?? []))
      .catch(() => setReasons([]));
  }, [open]);

  const submit = async () => {
    const reasonId = Number.parseInt(reason, 10);
    if (!reasonId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/chat/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason: reasonId }),
      });
      const result = (await response.json()) as { reported?: boolean; error?: string };
      if (!response.ok || !result.reported) {
        setError(result.error ?? "Could not send report.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not send report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report message</DialogTitle>
          <DialogDescription>
            Report {authorName}&apos;s message to Yaarzo moderators via CodyChat.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <p className="text-sm text-muted-foreground">Thank you. Your report was submitted.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {done ? "Close" : "Cancel"}
          </Button>
          {!done ? (
            <Button
              type="button"
              className="accent-button"
              disabled={!reason || submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Sending…" : "Report"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
