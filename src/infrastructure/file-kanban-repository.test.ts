import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FileKanbanRepository, createCardId, formatColumnName, isUserStoryFileName } from "./file-kanban-repository";

async function createTempBoard() {
  const root = await mkdtemp(path.join(os.tmpdir(), "kamban-"));
  await mkdir(path.join(root, "01-backlog"));
  await mkdir(path.join(root, "02-done"));
  await writeFile(
    path.join(root, "01-backlog", "us-010-testar-repositorio.md"),
    "# US-010 - Testar repositorio\n\nPrioridade: P2\nComplexidade: S\n\n## Historia\n\nMover arquivos.",
    "utf8"
  );
  await writeFile(path.join(root, "01-backlog", "notes.md"), "# Notes", "utf8");
  await writeFile(path.join(root, "01-backlog", "US-011.md"), "# US-011 - Sem titulo no arquivo", "utf8");
  await writeFile(path.join(root, "01-backlog", "US-ABC-invalid.md"), "# Invalid", "utf8");
  await writeFile(path.join(root, "01-backlog", "US-012-valid.txt"), "# Invalid extension", "utf8");
  return root;
}

describe("FileKanbanRepository", () => {
  it("reads folders as columns and markdown files as cards", async () => {
    const root = await createTempBoard();
    const board = await new FileKanbanRepository(root).getBoard();

    expect(board.columns).toHaveLength(2);
    expect(board.columns[0].name).toBe("Backlog");
    expect(board.columns[0].cards).toHaveLength(1);
    expect(board.columns[0].cards[0]).toMatchObject({
      title: "Testar repositorio",
      priority: "P2",
      complexity: "S"
    });
  });

  it("moves a markdown file between folders", async () => {
    const root = await createTempBoard();
    const repository = new FileKanbanRepository(root);

    await repository.moveCard({
      cardId: createCardId("01-backlog", "us-010-testar-repositorio.md"),
      fromColumnId: "01-backlog",
      toColumnId: "02-done"
    });

    await expect(readFile(path.join(root, "02-done", "us-010-testar-repositorio.md"), "utf8")).resolves.toContain("US-010");
    await expect(repository.getBoard()).resolves.toMatchObject({
      columns: [{ id: "01-backlog", cards: [] }, { id: "02-done", cards: [{ columnId: "02-done" }] }]
    });
  });

  it("accepts only files matching US-000-title.md", () => {
    expect(isUserStoryFileName("US-001-title.md")).toBe(true);
    expect(isUserStoryFileName("us-999-title-with-dashes.md")).toBe(true);
    expect(isUserStoryFileName("US-001.md")).toBe(false);
    expect(isUserStoryFileName("US-1-title.md")).toBe(false);
    expect(isUserStoryFileName("US-ABC-title.md")).toBe(false);
    expect(isUserStoryFileName("notes.md")).toBe(false);
    expect(isUserStoryFileName("US-001-title.txt")).toBe(false);
  });

  it("formats folder names for display", () => {
    expect(formatColumnName("02-em-andamento")).toBe("Em Andamento");
  });
});
