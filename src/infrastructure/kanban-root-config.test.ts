import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getKanbanRootDir, resolveConfigPaths, setKanbanRootDir } from "./kanban-root-config";

async function createTempWorkspace() {
  return mkdtemp(path.join(os.tmpdir(), "kamban-config-"));
}

describe("kanban root config", () => {
  it("uses the default board folder when config does not exist", async () => {
    const workspace = await createTempWorkspace();

    await expect(getKanbanRootDir(workspace)).resolves.toBe(path.join(workspace, "data", "kanban"));
  });

  it("persists a selected root directory", async () => {
    const workspace = await createTempWorkspace();
    const rootDir = path.join(workspace, "stories");
    await mkdir(rootDir);

    await expect(setKanbanRootDir(rootDir, workspace)).resolves.toBe(rootDir);
    await expect(getKanbanRootDir(workspace)).resolves.toBe(rootDir);
  });

  it("rejects files as board root", async () => {
    const workspace = await createTempWorkspace();
    const filePath = path.join(workspace, "not-a-folder.txt");
    await writeFile(filePath, "nope", "utf8");

    await expect(setKanbanRootDir(filePath, workspace)).rejects.toThrow("pasta");
  });

  it("falls back to default when config has invalid JSON", async () => {
    const workspace = await createTempWorkspace();
    const paths = resolveConfigPaths(workspace);
    await mkdir(paths.configDir);
    await writeFile(paths.configPath, "{", "utf8");

    await expect(getKanbanRootDir(workspace)).resolves.toBe(paths.defaultRootDir);
  });

  it("writes the selected path in config JSON", async () => {
    const workspace = await createTempWorkspace();
    const rootDir = path.join(workspace, "board");
    await mkdir(rootDir);

    await setKanbanRootDir(rootDir, workspace);

    await expect(readFile(resolveConfigPaths(workspace).configPath, "utf8")).resolves.toContain(rootDir);
  });
});
