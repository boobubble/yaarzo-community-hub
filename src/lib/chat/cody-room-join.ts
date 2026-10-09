export type CodyRoomJoinResult =
  | { ok: true; data?: unknown }
  | {
      ok: false;
      status: 400 | 403 | 502;
      reason: "wrong_password" | "access_requirement" | "rejected" | "invalid_response";
      error: string;
      code?: number;
    };

export function buildCodyRoomJoinBody(room: number, token: string, password?: string) {
  const body = new URLSearchParams({ room: String(room), token });
  if (password !== undefined) {
    body.set("pass", password.slice(0, 128));
    body.set("join_room_pass", "1");
  } else {
    body.set("join_room", "1");
  }
  return body;
}

export function parseCodyRoomJoinResponse(raw: string, upstreamOk: boolean): CodyRoomJoinResult {
  if (upstreamOk && raw.trim() === "") return { ok: true };

  let payload: {
    code?: number;
    data?: unknown;
    access_requirement?: unknown;
    error?: unknown;
    etype?: unknown;
    emessage?: unknown;
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return {
      ok: false,
      status: 502,
      reason: "invalid_response",
      error: "CodyChat room change is unavailable.",
    };
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "access_requirement") ||
    payload.error === "access_requirement" ||
    payload.etype === "access_requirement" ||
    payload.emessage === "access_requirement"
  ) {
    return {
      ok: false,
      status: 403,
      reason: "access_requirement",
      error: "You do not have access to this room.",
    };
  }

  if (payload.code === 5 || payload.error === "wrong_pass" || payload.etype === "wrong_pass") {
    return {
      ok: false,
      status: 400,
      reason: "wrong_password",
      error: "Incorrect room password.",
      ...(payload.code !== undefined ? { code: payload.code } : {}),
    };
  }

  if (!upstreamOk) {
    return {
      ok: false,
      status: 502,
      reason: "rejected",
      error: "CodyChat room change is unavailable.",
      ...(payload.code !== undefined ? { code: payload.code } : {}),
    };
  }

  if (payload.code === 10) return { ok: true, data: payload.data };

  return {
    ok: false,
    status: 400,
    reason: "rejected",
    error: "CodyChat rejected the room change.",
    ...(payload.code !== undefined ? { code: payload.code } : {}),
  };
}
