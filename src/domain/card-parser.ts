import matter from "gray-matter";
import type { Complexity, KanbanCard, Priority } from "./kanban";

const DEFAULT_PRIORITY: Priority = "PX";
const DEFAULT_COMPLEXITY: Complexity = "N/A";

export type ParseMarkdownCardInput = {
  id: string;
  fileName: string;
  columnId: string;
  markdown: string;
  createdAt: Date;
};

export function parseMarkdownCard(input: ParseMarkdownCardInput): KanbanCard {
  const parsed = matter(input.markdown);
  const content = parsed.content.trim();
  const lines = content.split(/\r?\n/);
  const titleLine = lines.find((line) => line.startsWith("# ")) ?? "# Sem titulo";
  const { usNumber, title } = parseHeading(titleLine);

  return {
    id: input.id,
    fileName: input.fileName,
    columnId: input.columnId,
    title,
    usNumber,
    priority: normalizePriority(readField(content, "Prioridade")),
    complexity: normalizeComplexity(readField(content, "Complexidade")),
    source: parseSources(readField(content, "Fonte")),
    createdAt: input.createdAt.toISOString(),
    body: content,
    sections: parseSections(content)
  };
}

function parseHeading(line: string) {
  const clean = line.replace(/^#\s+/, "").trim();
  const match = clean.match(/^(US-\d+)\s*-\s*(.+)$/i);

  return {
    usNumber: match?.[1]?.toUpperCase() ?? "US-000",
    title: match?.[2]?.trim() ?? clean
  };
}

function readField(markdown: string, field: string) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^${escaped}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim();
}

function normalizePriority(value?: string): Priority {
  const normalized = value?.toUpperCase();
  if (normalized === "P0" || normalized === "P1" || normalized === "P2" || normalized === "P3") {
    return normalized;
  }
  return DEFAULT_PRIORITY;
}

function normalizeComplexity(value?: string): Complexity {
  const normalized = value?.toUpperCase();
  if (normalized === "XS" || normalized === "S" || normalized === "M" || normalized === "L" || normalized === "XL") {
    return normalized;
  }
  return DEFAULT_COMPLEXITY;
}

function parseSources(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.replace(/`/g, "").trim())
    .filter(Boolean);
}

function parseSections(markdown: string) {
  const sections: Record<string, string> = {};
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];

  for (const [index, match] of matches.entries()) {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    sections[title] = markdown.slice(start, end).trim();
  }

  return sections;
}
