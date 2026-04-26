export interface PostMessageArgs {
  channel: string;
  text: string;
  thread_ts?: string;
  unfurl_links?: boolean;
}

export interface PostMessageResult {
  ok: boolean;
  ts?: string;
  error?: string;
}

export async function postMessage(args: PostMessageArgs): Promise<PostMessageResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN missing" };

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: args.channel,
      text: args.text,
      thread_ts: args.thread_ts,
      unfurl_links: args.unfurl_links ?? false,
    }),
  });
  const data = (await res.json()) as { ok: boolean; ts?: string; error?: string };
  return data;
}

export interface ResponseUrlPayload {
  text: string;
  response_type?: "ephemeral" | "in_channel";
  replace_original?: boolean;
  delete_original?: boolean;
}

export async function postToResponseUrl(
  responseUrl: string,
  payload: ResponseUrlPayload,
): Promise<void> {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
