import { parseMarkdownCard } from "@/src/domain/card-parser";
import type { KanbanBoard, KanbanRepository, MoveCardInput } from "@/src/domain/kanban";
import { compareColumnFolderNames, createCardId, formatColumnName, isUserStoryFileName } from "@/src/domain/kanban-files";

const DB_NAME = "kamban";
const STORE_NAME = "handles";
const ROOT_HANDLE_KEY = "root-directory";

type FileSystemPermissionMode = "read" | "readwrite";

type DirectoryPickerOptions = {
  id?: string;
  mode?: FileSystemPermissionMode;
};

type PermissionDescriptor = {
  mode?: FileSystemPermissionMode;
};

export type BrowserFileHandle = {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
};

export type BrowserDirectoryHandle = {
  kind: "directory";
  name: string;
  entries(): AsyncIterableIterator<[string, BrowserDirectoryHandle | BrowserFileHandle]>;
  getDirectoryHandle(name: string): Promise<BrowserDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<BrowserFileHandle>;
  removeEntry(name: string): Promise<void>;
  queryPermission(descriptor?: PermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: PermissionDescriptor): Promise<PermissionState>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<BrowserDirectoryHandle>;
  }
}

export class BrowserKanbanRepository implements KanbanRepository {
  constructor(private readonly rootHandle: BrowserDirectoryHandle) {}

  get rootName() {
    return this.rootHandle.name;
  }

  async getBoard(): Promise<KanbanBoard> {
    const folderEntries: BrowserDirectoryHandle[] = [];

    for await (const [, entry] of this.rootHandle.entries()) {
      if (entry.kind === "directory") {
        folderEntries.push(entry);
      }
    }

    const columns = await Promise.all(
      folderEntries
        .sort((a, b) => compareColumnFolderNames(a.name, b.name))
        .map(async (folder) => {
          const files: BrowserFileHandle[] = [];

          for await (const [, entry] of folder.entries()) {
            if (entry.kind === "file" && isUserStoryFileName(entry.name)) {
              files.push(entry);
            }
          }

          const cards = await Promise.all(
            files
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(async (fileHandle) => {
                const file = await fileHandle.getFile();
                const markdown = await file.text();

                return parseMarkdownCard({
                  id: createCardId(folder.name, file.name),
                  fileName: file.name,
                  columnId: folder.name,
                  markdown,
                  createdAt: new Date(file.lastModified)
                });
              })
          );

          return {
            id: folder.name,
            name: formatColumnName(folder.name),
            path: `${this.rootHandle.name}/${folder.name}`,
            cards
          };
        })
    );

    return { columns };
  }

  async moveCard(input: MoveCardInput): Promise<void> {
    const fromColumn = await this.rootHandle.getDirectoryHandle(input.fromColumnId);
    const toColumn = await this.rootHandle.getDirectoryHandle(input.toColumnId);
    const board = await this.getBoard();
    const card = board.columns
      .find((column) => column.id === input.fromColumnId)
      ?.cards.find((item) => item.id === input.cardId);

    if (!card) {
      throw new Error("Card not found.");
    }

    const sourceHandle = await fromColumn.getFileHandle(card.fileName);
    const sourceFile = await sourceHandle.getFile();
    const targetHandle = await toColumn.getFileHandle(card.fileName, { create: true });
    const writable = await targetHandle.createWritable();

    await writable.write(await sourceFile.text());
    await writable.close();
    await fromColumn.removeEntry(card.fileName);
  }
}

export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export async function pickBrowserKanbanRepository() {
  if (!window.showDirectoryPicker) {
    throw new Error("Este navegador nao permite acesso local a pastas. Use Chrome ou Edge.");
  }

  const handle = await window.showDirectoryPicker({ id: "kamban-root", mode: "readwrite" });
  await ensureReadWritePermission(handle);
  await saveRootHandle(handle);

  return new BrowserKanbanRepository(handle);
}

export async function loadStoredBrowserKanbanRepository() {
  if (!isFileSystemAccessSupported()) return null;

  const handle = await readRootHandle();
  if (!handle) return null;

  await ensureReadWritePermission(handle);

  return new BrowserKanbanRepository(handle);
}

export async function ensureReadWritePermission(handle: BrowserDirectoryHandle) {
  const currentPermission = await handle.queryPermission({ mode: "readwrite" });
  if (currentPermission === "granted") return;

  const nextPermission = await handle.requestPermission({ mode: "readwrite" });
  if (nextPermission !== "granted") {
    throw new Error("Permissao de leitura e escrita negada para a pasta selecionada.");
  }
}

async function saveRootHandle(handle: BrowserDirectoryHandle) {
  const db = await openHandlesDb();
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(handle, ROOT_HANDLE_KEY));
  db.close();
}

async function readRootHandle() {
  const db = await openHandlesDb();
  const handle = await requestToPromise<BrowserDirectoryHandle | undefined>(
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ROOT_HANDLE_KEY)
  );
  db.close();
  return handle ?? null;
}

function openHandlesDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T = unknown>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
