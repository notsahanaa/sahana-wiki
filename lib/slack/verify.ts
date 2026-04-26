import { createHmac, timingSafeEqual } from "node:crypto";

const FIVE_MINUTES = 5 * 60;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing-headers" | "stale" | "bad-signature" | "no-secret" };

export function verifySlackRequest(
  headers: Headers,
  rawBody: string,
  signingSecret: string | undefined,
  now: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  if (!signingSecret) return { ok: false, reason: "no-secret" };

  const timestamp = headers.get("x-slack-request-timestamp");
  const signature = headers.get("x-slack-signature");
  if (!timestamp || !signature) return { ok: false, reason: "missing-headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > FIVE_MINUTES) {
    return { ok: false, reason: "stale" };
  }

  const expected =
    "v0=" +
    createHmac("sha256", signingSecret)
      .update(`v0:${timestamp}:${rawBody}`)
      .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad-signature" };
  }
  return { ok: true };
}
