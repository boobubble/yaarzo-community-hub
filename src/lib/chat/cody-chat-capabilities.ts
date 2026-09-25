export type CodyChatCapabilities = {
  canUploadChat: boolean;
  canReport: boolean;
  fileMaxMb: number;
  userRank: number;
};

const DEFAULT_FILE_MAX_MB = 500;

export function parseCodyChatCapabilitiesFromHtml(html: string): CodyChatCapabilities {
  const userRank = Number.parseInt(html.match(/var\s+user_rank\s*=\s*(\d+)/u)?.[1] ?? "", 10);
  const fileMaxMb = Number.parseInt(html.match(/var\s+fileMax\s*=\s*(\d+)/u)?.[1] ?? "", 10);
  const canReport = /var\s+canReport\s*=\s*1\s*;/u.test(html);
  const canUploadChat =
    /id\s*=\s*["']chat_file["']/iu.test(html) ||
    /uploadChatFile\s*\(/u.test(html);

  return {
    canUploadChat,
    canReport,
    fileMaxMb: Number.isFinite(fileMaxMb) && fileMaxMb > 0 ? fileMaxMb : DEFAULT_FILE_MAX_MB,
    userRank: Number.isFinite(userRank) ? userRank : 0,
  };
}
