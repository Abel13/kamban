import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type StoredConfig = {
  rootDir?: string;
};

export const defaultKanbanRootDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "kanban");

export async function getKanbanRootDir(baseDir = /* turbopackIgnore: true */ process.cwd()) {
  const paths = resolveConfigPaths(baseDir);

  try {
    const raw = await readFile(paths.configPath, "utf8");
    const config = JSON.parse(raw) as StoredConfig;
    return config.rootDir ? path.resolve(config.rootDir) : paths.defaultRootDir;
  } catch {
    return paths.defaultRootDir;
  }
}

export async function setKanbanRootDir(inputPath: string, baseDir = /* turbopackIgnore: true */ process.cwd()) {
  const paths = resolveConfigPaths(baseDir);
  const rootDir = path.resolve(/* turbopackIgnore: true */ inputPath.trim());
  const rootStat = await stat(rootDir);

  if (!rootStat.isDirectory()) {
    throw new Error("O caminho informado nao e uma pasta.");
  }

  await mkdir(paths.configDir, { recursive: true });
  await writeFile(paths.configPath, JSON.stringify({ rootDir }, null, 2), "utf8");

  return rootDir;
}

export function resolveConfigPaths(baseDir: string) {
  return {
    defaultRootDir: path.join(baseDir, "data", "kanban"),
    configDir: path.join(baseDir, ".kamban"),
    configPath: path.join(baseDir, ".kamban", "config.json")
  };
}
