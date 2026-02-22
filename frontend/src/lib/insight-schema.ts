/**
 * Schema for sending annotations to the AI insight API.
 * recencyWeight (0–1) tells the model to emphasize newer annotations.
 */

export interface AnnotationForInsight {
  pageTitle: string;
  aiCategory: string;
  aiTags: string[];
  /** Highlight text or sticky note content (truncated). */
  contentSnippet: string;
  /** ISO timestamp. */
  timestamp: string;
  /**
   * Recency weight 0–1. Newer annotations have higher weight.
   * Example: last 24h ≈ 1.0, last 7 days ≈ 0.7, older ≈ 0.4.
   */
  recencyWeight: number;
}

export interface InsightPayload {
  annotations: AnnotationForInsight[];
  /** Instruction for the model: give more weight to higher recencyWeight. */
  recencyInstruction: string;
}

const MS_24H = 24 * 60 * 60 * 1000;
const MS_7D = 7 * MS_24H;

/**
 * Maps a single annotation to the insight schema and computes recency weight.
 * Newer = higher weight (last 24h → 1.0, last 7d → 0.7, older → 0.4).
 */
function toAnnotationForInsight(
  annotation: { pageTitle: string; aiCategory: string; aiTags: string[]; timestamp: string; highlightedText?: string; stickyNoteContent?: string },
  now: number
): AnnotationForInsight {
  const ts = new Date(annotation.timestamp).getTime();
  const ageMs = now - ts;
  let recencyWeight: number;
  if (ageMs <= MS_24H) recencyWeight = 1.0;
  else if (ageMs <= MS_7D) recencyWeight = 0.7;
  else recencyWeight = 0.4;

  const contentSnippet =
    annotation.highlightedText?.slice(0, 200) ||
    annotation.stickyNoteContent?.slice(0, 200) ||
    "";

  return {
    pageTitle: annotation.pageTitle,
    aiCategory: annotation.aiCategory,
    aiTags: annotation.aiTags,
    contentSnippet,
    timestamp: annotation.timestamp,
    recencyWeight,
  };
}

/**
 * Builds the payload for the insight API from the current annotations list.
 * Annotations are sorted newest-first; each gets a recencyWeight.
 */
export function buildInsightPayload(
  annotations: Array<{
    pageTitle: string;
    aiCategory: string;
    aiTags: string[];
    timestamp: string;
    highlightedText?: string;
    stickyNoteContent?: string;
  }>
): InsightPayload {
  const now = Date.now();
  const sorted = [...annotations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const forInsight = sorted.map((a) => toAnnotationForInsight(a, now));
  return {
    annotations: forInsight,
    recencyInstruction:
      "Give slightly more weight to the most recent annotations (higher recencyWeight). Use them to shape the main takeaway and suggestions.",
  };
}

/**
 * Fallback summary when the AI API is unavailable (quota, rate limit, etc.).
 * Builds a short insight from annotations with more weight on recent ones.
 */
export function getFallbackInsight(
  annotations: Array<{ aiCategory: string; timestamp: string }>
): string {
  if (annotations.length === 0) return "";
  const now = Date.now();
  const weighted = new Map<string, number>();
  for (const a of annotations) {
    const ageMs = now - new Date(a.timestamp).getTime();
    const w = ageMs <= MS_24H ? 1.0 : ageMs <= MS_7D ? 0.7 : 0.4;
    weighted.set(a.aiCategory, (weighted.get(a.aiCategory) ?? 0) + w);
  }
  const top = [...weighted.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
  if (top.length === 0) return "";
  if (top.length === 1) {
    return `You've been exploring **${top[0]}** in your recent annotations. Consider going deeper in this area.`;
  }
  if (top.length === 2) {
    return `You've been exploring **${top[0]}** and **${top[1]}** lately. Consider connecting ideas between these topics.`;
  }
  return `Your recent annotations focus on **${top[0]}**, **${top[1]}**, and **${top[2]}**. Consider picking one to explore further this week.`;
}
