import type { Category } from "@/lib/mock-data";

const PRESET: Record<string, { icon: string; color: string }> = {
  "Machine Learning": { icon: "🧠", color: "yellow" },
  Productivity: { icon: "⚡", color: "orange" },
  "UX Research": { icon: "🔬", color: "green" },
  "Web Development": { icon: "💻", color: "blue" },
  History: { icon: "📜", color: "blue" },
  "Critical Thinking": { icon: "🎯", color: "orange" },
  "Design Systems": { icon: "🎨", color: "pink" },
};

const FALLBACK_ICONS = ["📁", "📌", "📂", "🔖", "📎", "💡", "📋", "🗂️"];
const FALLBACK_COLORS = ["blue", "green", "orange", "pink", "yellow"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function getIconAndColor(name: string): { icon: string; color: string } {
  const preset = PRESET[name];
  if (preset) return preset;
  const n = hash(name);
  return {
    icon: FALLBACK_ICONS[n % FALLBACK_ICONS.length],
    color: FALLBACK_COLORS[n % FALLBACK_COLORS.length],
  };
}

/**
 * Derives categories from annotations by grouping on aiCategory.
 * Sorted by count descending. Icon and color from preset or deterministic fallback.
 */
export function deriveCategoriesFromAnnotations(
  annotations: Array<{ aiCategory: string }>
): Category[] {
  const countByCategory = new Map<string, number>();
  for (const a of annotations) {
    const name = a.aiCategory.trim() || "Uncategorized";
    countByCategory.set(name, (countByCategory.get(name) ?? 0) + 1);
  }
  return [...countByCategory.entries()]
    .map(([name, count]) => ({
      name,
      count,
      ...getIconAndColor(name),
    }))
    .sort((a, b) => b.count - a.count);
}
