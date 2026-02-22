const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const CONFIDENCE_THRESHOLD = 0.75;

export interface CategoryClassificationInput {
  pageTitle: string;
  highlightedText?: string;
  stickyNoteContent?: string;
}

export interface CategoryClassificationResult {
  category: string;
  isExisting: boolean;
}

interface RawClassification {
  matchedCategory: string | null;
  confidence: number;
  suggestedNewCategory: string;
}

function parseJsonFromResponse(text: string): RawClassification | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as RawClassification;
  } catch {
    return null;
  }
}

/**
 * Asks the AI to either match the annotation to an existing category (if ≥75%
 * confident) or suggest a new category name. Uses VITE_OPENAI_API_KEY.
 */
export async function getCategoryForAnnotation(
  annotation: CategoryClassificationInput,
  existingCategoryNames: string[]
): Promise<CategoryClassificationResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const apiUrl = (import.meta.env.VITE_OPENAI_API_URL as string) || OPENAI_URL;
  if (!apiKey?.trim()) {
    throw new Error("VITE_OPENAI_API_KEY is not set.");
  }

  const content = [
    annotation.pageTitle,
    annotation.highlightedText,
    annotation.stickyNoteContent,
  ]
    .filter(Boolean)
    .join("\n\n");
  const existingList =
    existingCategoryNames.length > 0
      ? existingCategoryNames.join(", ")
      : "(none yet)";

  const systemPrompt = `You classify reading annotations into categories. You must respond with exactly one JSON object, no other text, in this form:
{"matchedCategory": "<existing category name exactly as given, or null>", "confidence": <0.0 to 1.0>, "suggestedNewCategory": "<short topic name if not matching>"}

Rules:
- If the annotation clearly fits one of the existing categories, set matchedCategory to that exact name and confidence to how sure you are (0.0-1.0).
- If no existing category fits well OR your confidence in a match is below 0.75, set matchedCategory to null and give a short suggestedNewCategory (2-4 words).
- Existing categories (use these names exactly if you match): ${existingList}`;

  const userPrompt = `Annotation content:\n${content}\n\nReturn only the JSON object.`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: (import.meta.env.VITE_OPENAI_MODEL as string) || DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 150,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message: string;
    try {
      const errJson = JSON.parse(errText) as { error?: { message?: string; code?: string } };
      message = errJson.error?.message ?? errText;
    } catch {
      message = errText;
    }
    throw new Error(message);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  const parsed = parseJsonFromResponse(raw);
  if (!parsed) {
    throw new Error("Could not parse category classification response.");
  }

  const useExisting =
    parsed.matchedCategory != null &&
    parsed.confidence >= CONFIDENCE_THRESHOLD &&
    existingCategoryNames.includes(parsed.matchedCategory);

  return {
    category: useExisting
      ? parsed.matchedCategory
      : (parsed.suggestedNewCategory?.trim() || "Uncategorized"),
    isExisting: useExisting,
  };
}
