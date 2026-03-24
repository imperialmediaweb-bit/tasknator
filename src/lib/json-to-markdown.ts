/**
 * Convert JSON objects/arrays to readable markdown.
 * Used by:
 *  - Asset preview (client-side)
 *  - Asset regenerate route (server-side)
 *  - Admin fix-json-assets route
 */

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function jsonToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);

  if (Array.isArray(obj)) {
    if (obj.every((v) => typeof v === "string" || typeof v === "number")) {
      return obj.map((v) => `- ${v}`).join("\n");
    }
    return obj
      .map((item, i) => {
        if (typeof item === "object" && item !== null) {
          const title =
            item.title || item.name || item.headline || item.subject || null;
          const heading =
            depth === 0
              ? `## ${title || `Item ${i + 1}`}`
              : `### ${title || `${i + 1}.`}`;
          const entries = Object.entries(item).filter(
            ([k]) =>
              !title || (k !== "title" && k !== "name" && k !== "headline" && k !== "subject")
          );
          const body = entries
            .map(([k, v]) => {
              const label = formatKey(k);
              if (
                typeof v === "string" ||
                typeof v === "number" ||
                typeof v === "boolean"
              ) {
                return `**${label}:** ${v}`;
              }
              if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
                return `**${label}:**\n${v.map((x) => `- ${x}`).join("\n")}`;
              }
              return `**${label}:**\n\n${jsonToMarkdown(v, depth + 2)}`;
            })
            .join("\n\n");
          return `${heading}\n\n${body}`;
        }
        return `- ${String(item)}`;
      })
      .join("\n\n---\n\n");
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const label = formatKey(key);
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          return `**${label}:** ${value}`;
        }
        if (
          Array.isArray(value) &&
          value.every((v) => typeof v === "string")
        ) {
          return `**${label}:**\n${value.map((v) => `- ${v}`).join("\n")}`;
        }
        const heading =
          depth === 0 ? `## ${label}` : depth === 1 ? `### ${label}` : `**${label}**`;
        return `${heading}\n\n${jsonToMarkdown(value, depth + 1)}`;
      })
      .join("\n\n");
  }

  return String(obj);
}

/**
 * Strip code fences and convert JSON content to markdown.
 * Returns null if content is not JSON.
 */
export function convertJsonContent(raw: string): string | null {
  let cleaned = raw.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");
  cleaned = cleaned.trim();

  if (
    (cleaned.startsWith("{") && cleaned.endsWith("}")) ||
    (cleaned.startsWith("[") && cleaned.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(cleaned);
      return jsonToMarkdown(parsed);
    } catch {
      return null;
    }
  }
  return null;
}
