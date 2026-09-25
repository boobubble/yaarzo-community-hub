/** CodyChat `listReport()` / `validReport()` reason ids (type 1 = public chat). */
export const CODY_CHAT_REPORT_REASONS = [
  { id: 1, label: "Inappropriate language" },
  { id: 2, label: "Inappropriate content" },
  { id: 3, label: "Spam or fraud" },
] as const;

export function isValidCodyReportReason(value: number) {
  return CODY_CHAT_REPORT_REASONS.some((reason) => reason.id === value);
}
