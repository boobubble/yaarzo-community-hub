export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isValidUserDmChannel(channelId: string): boolean {
  if (!channelId.startsWith("dm:")) return false;
  const parts = channelId.slice(3).split(":");
  if (parts.length !== 2) return false;
  return isUuid(parts[0]) && isUuid(parts[1]);
}

export function buildDmChannel(currentUserId: string, targetUserId: string): string | null {
  if (!isUuid(currentUserId) || !isUuid(targetUserId)) return null;
  if (currentUserId === targetUserId) return null;
  const participantIds = [currentUserId, targetUserId].sort();
  return `dm:${participantIds[0]}:${participantIds[1]}`;
}

export function isRemoteDmChannel(
  channelId: string,
  authUserId: string | null | undefined,
): boolean {
  if (!authUserId || !isUuid(authUserId) || !isValidUserDmChannel(channelId)) return false;
  const parts = channelId.slice(3).split(":");
  return parts[0] === authUserId || parts[1] === authUserId;
}

export function parseDmChannel(
  channelId: string,
  authUserId?: string | null,
): { peerId: string | null; valid: boolean } {
  if (!isValidUserDmChannel(channelId)) {
    return { peerId: null, valid: false };
  }
  const parts = channelId.slice(3).split(":");
  if (authUserId && isUuid(authUserId)) {
    const peer =
      parts[0] === authUserId ? parts[1] : parts[1] === authUserId ? parts[0] : null;
    return { peerId: peer, valid: !!peer };
  }
  return { peerId: parts[0], valid: true };
}

export const DM_MESSAGES_INSERT_FILTER = "channel_id=like.dm:%";
