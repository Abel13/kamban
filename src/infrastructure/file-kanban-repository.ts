import { mkdir, readdir, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import { parseMarkdownCard } from "@/src/domain/card-parser";
import type { KanbanBoard, KanbanRepository, MoveCardInput } from "@/src/domain/kanban";

const userStoryFilePattern = /^us-\d{3}-.+\.md$/i;

export class FileKanbanRepository implements KanbanRepository {
  constructor(private readonly rootDir: string) {}

  async getBoard(): Promise<KanbanBoard> {
    await mkdir(/* turbopackIgnore: true */ this.rootDir, { recursive: true });
    const entries = await readdir(/* turbopackIgnore: true */ this.rootDir, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    const columns = await Promise.all(
      folders.map(async (folder) => {
        const folderPath = path.join(/* turbopackIgnore: true */ this.rootDir, folder.name);
        const files = (await readdir(/* turbopackIgnore: true */ folderPath, { withFileTypes: true }))
          .filter((entry) => entry.isFile() && isUserStoryFileName(entry.name))
          .sort((a, b) => a.name.localeCompare(b.name));

        const cards = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(/* turbopackIgnore: true */ folderPath, file.name);
            const [markdown, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
            const id = createCardId(folder.name, file.name);

            return parseMarkdownCard({
              id,
              fileName: file.name,
              columnId: folder.name,
              markdown,
              createdAt: fileStat.birthtimeMs > 0 ? fileStat.birthtime : fileStat.ctime
            });
          })
        );

        return {
          id: folder.name,
          name: formatColumnName(folder.name),
          path: folderPath,
          cards
        };
      })
    );

    return { columns };
  }

  async moveCard(input: MoveCardInput): Promise<void> {
    const board = await this.getBoard();
    const fromColumn = board.columns.find((column) => column.id === input.fromColumnId);
    const toColumn = board.columns.find((column) => column.id === input.toColumnId);
    const card = fromColumn?.cards.find((item) => item.id === input.cardId);

    if (!fromColumn || !toColumn || !card) {
      throw new Error("Card or column not found.");
    }

    await rename(
      path.join(/* turbopackIgnore: true */ fromColumn.path, card.fileName),
      path.join(/* turbopackIgnore: true */ toColumn.path, card.fileName)
    );
  }
}

export function createCardId(columnId: string, fileName: string) {
  void columnId;
  return fileName;
}

export function isUserStoryFileName(fileName: string) {
  return userStoryFilePattern.test(fileName);
}

export function formatColumnName(folderName: string) {
  return folderName
    .replace(/^\d+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
