import type { InsightPayload } from "@/lib/insight-schema";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

function buildPrompt(payload: InsightPayload): string {
  const parts = [
    payload.recencyInstruction,
    "",
    "Annotations (newest first; recencyWeight in brackets):",
    ...payload.annotations.map(
      (a) =>
        `- [weight ${a.recencyWeight}] ${a.pageTitle} | ${a.aiCategory} | tags: ${a.aiTags.join(", ")}${a.contentSnippet ? ` | "${a.contentSnippet}"` : ""}`
    ),
    "",
    "Write a short 2–3 sentence insight for the user: what they've been exploring, and one concrete suggestion (topic or direction). Use bold for category/topic names. Output plain text only, no markdown headers.",
  ];
  return parts.join("\n");
}

export interface InsightResult {
  text: string;
}

/**
 * Calls the AI API to generate an insight from the given payload.
 * Requires VITE_OPENAI_API_KEY. Optional VITE_OPENAI_API_URL overrides the endpoint.
 */
export async function fetchInsight(payload: InsightPayload): Promise<InsightResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const apiUrl = (import.meta.env.VITE_OPENAI_API_URL as string) || OPENAI_URL;
  if (!apiKey?.trim()) {
    throw new Error("VITE_OPENAI_API_KEY is not set.");
  }

  const prompt = buildPrompt(payload);
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: (import.meta.env.VITE_OPENAI_MODEL as string) || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a concise assistant that summarizes a user's reading and annotation habits. Respond with a brief, friendly insight and one suggestion. Use **bold** only for topic or category names.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 256,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message: string;
    try {
      const errJson = JSON.parse(errText) as { error?: { message?: string; code?: string } };
      const code = errJson.error?.code;
      const msg = errJson.error?.message ?? errText;
      if (res.status === 429 || code === "insufficient_quota" || code === "rate_limit_exceeded") {
        message =
          "AI insight is unavailable: API quota or rate limit reached. Check your OpenAI plan and billing at platform.openai.com, or try again later.";
      } else {
        message = msg;
      }
    } catch {
      message = errText;
    }
    throw new Error(message);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text =
    data.choices?.[0]?.message?.content?.trim() ||
    "Unable to generate insight.";
  return { text };
}
