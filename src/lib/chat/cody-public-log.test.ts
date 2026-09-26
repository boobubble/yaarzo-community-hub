import { describe, expect, it } from "vitest";

import { resolveCodyPublicUrl } from "@/lib/chat/cody-chat-origin";
import {
  extractChatPollLogs,
  normalizePublicChatLogs,
} from "@/lib/chat/cody-public-log";

export const EUGENE_SYSTEM_JOIN_LOG = {
  user_id: 2,
  user_name: "System",
  user_tumb: "default_system.png",
  user_bot: 9,
  log_id: 283,
  log_type: "system__join",
  log_content: "",
  log_sys: 1,
  tid: 21,
  tname: "eugene",
  custom: "",
} as const;

describe("normalizePublicChatLogs", () => {
  it("parses system__join with empty log_content from exact Cody row", () => {
    const [message] = normalizePublicChatLogs([EUGENE_SYSTEM_JOIN_LOG]);

    expect(message).toBeDefined();
    expect(message?.system).toBe(true);
    expect(message?.systemLogType).toBe("system__join");
    expect(message?.systemSubjectName).toBe("eugene");
    expect(message?.content).toBe("eugene has joined the room");
    expect(message?.id).toBe("283");
    expect(message?.systemAvatarUrl).toBe(
      resolveCodyPublicUrl("default_system.png"),
    );
  });
});

describe("extractChatPollLogs", () => {
  it("prefers mlogs over rdata.room_logs on incremental poll shape", () => {
    const payload = {
      cact: 241,
      last: 283,
      mlogs: [EUGENE_SYSTEM_JOIN_LOG],
      rdata: {
        room_logs: [],
        room_action: 241,
      },
    };

    expect(extractChatPollLogs(payload)).toEqual([EUGENE_SYSTEM_JOIN_LOG]);

    const normalized = normalizePublicChatLogs(extractChatPollLogs(payload));
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.content).toBe("eugene has joined the room");
  });
});
