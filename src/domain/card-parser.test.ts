import { describe, expect, it } from "vitest";
import { parseMarkdownCard } from "./card-parser";

describe("parseMarkdownCard", () => {
  it("extracts core user story metadata from markdown", () => {
    const card = parseMarkdownCard({
      id: "backlog:us-001.md",
      fileName: "us-001.md",
      columnId: "backlog",
      createdAt: new Date("2026-01-02T03:04:00.000Z"),
      markdown: `# US-001 - Modal de upsell

Prioridade: P0
Complexidade: M
Dependencias bloqueantes: US-013, US-014
Dependencias nao bloqueantes: US-005, US-012
Fonte: \`a.md\`, \`b.md\`

## Historia de usuario

Como usuario, quero clareza.

## Criterios de aceite

- Deve funcionar.`
    });

    expect(card).toMatchObject({
      id: "backlog:us-001.md",
      title: "Modal de upsell",
      usNumber: "US-001",
      priority: "P0",
      complexity: "M",
      dependencies: {
        blocking: ["US-013", "US-014"],
        nonBlocking: ["US-005", "US-012"]
      },
      source: ["a.md", "b.md"],
      createdAt: "2026-01-02T03:04:00.000Z"
    });
    expect(card.sections["Historia de usuario"]).toContain("Como usuario");
    expect(card.sections["Criterios de aceite"]).toContain("Deve funcionar");
  });

  it("uses safe defaults when metadata is missing or unknown", () => {
    const card = parseMarkdownCard({
      id: "done:item.md",
      fileName: "item.md",
      columnId: "done",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      markdown: "# Ajuste sem numero\n\nPrioridade: urgente\nComplexidade: gigante\nDependencias bloqueantes: nenhuma"
    });

    expect(card.usNumber).toBe("US-000");
    expect(card.title).toBe("Ajuste sem numero");
    expect(card.priority).toBe("PX");
    expect(card.complexity).toBe("N/A");
    expect(card.dependencies).toEqual({ blocking: [], nonBlocking: [] });
    expect(card.source).toEqual([]);
  });
});
