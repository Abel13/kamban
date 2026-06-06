import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BrowserKanbanRepository,
  ensureReadWritePermission,
  isFileSystemAccessSupported,
  loadStoredBrowserKanbanRepository,
  pickBrowserKanbanRepository,
  type BrowserDirectoryHandle,
  type BrowserFileHandle
} from "./browser-kanban-repository";

class MemoryFileHandle implements BrowserFileHandle {
  readonly kind = "file";
  written = "";
  removed = false;

  constructor(
    readonly name: string,
    private content: string,
    private readonly lastModified = Date.parse("2026-01-01T00:00:00.000Z")
  ) {}

  async getFile() {
    return new File([this.content], this.name, { lastModified: this.lastModified });
  }

  async createWritable() {
    return {
      write: async (chunk: string) => {
        this.written = chunk;
        this.content = chunk;
      },
      close: async () => {}
    } as FileSystemWritableFileStream;
  }
}

class MemoryDirectoryHandle implements BrowserDirectoryHandle {
  readonly kind = "directory";
  permission: PermissionState = "granted";

  constructor(
    readonly name: string,
    private readonly children: Record<string, MemoryDirectoryHandle | MemoryFileHandle> = {}
  ) {}

  async *entries() {
    for (const [name, child] of Object.entries(this.children)) {
      yield [name, child] as [string, MemoryDirectoryHandle | MemoryFileHandle];
    }
  }

  async getDirectoryHandle(name: string) {
    const child = this.children[name];
    if (!(child instanceof MemoryDirectoryHandle)) throw new Error("Directory not found.");
    return child;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const child = this.children[name];
    if (child instanceof MemoryFileHandle) return child;
    if (!options?.create) throw new Error("File not found.");

    const nextFile = new MemoryFileHandle(name, "");
    this.children[name] = nextFile;
    return nextFile;
  }

  async removeEntry(name: string) {
    const child = this.children[name];
    if (child instanceof MemoryFileHandle) {
      child.removed = true;
    }
    delete this.children[name];
  }

  async queryPermission() {
    return this.permission;
  }

  async requestPermission() {
    return this.permission;
  }
}

describe("BrowserKanbanRepository", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads local directories as columns and markdown files as cards", async () => {
    const root = new MemoryDirectoryHandle("stories", {
      "02-done": new MemoryDirectoryHandle("02-done", {
        "us-002-done.md": new MemoryFileHandle("us-002-done.md", "# US-002 - Done\n\nPrioridade: P2")
      }),
      "01-backlog": new MemoryDirectoryHandle("01-backlog", {
        "notes.txt": new MemoryFileHandle("notes.txt", "ignored"),
        "us-001-start.md": new MemoryFileHandle("us-001-start.md", "# US-001 - Start\n\nComplexidade: M")
      })
    });

    const board = await new BrowserKanbanRepository(root).getBoard();

    expect(board.columns.map((column) => column.id)).toEqual(["01-backlog", "02-done"]);
    expect(board.columns[0]).toMatchObject({
      name: "Backlog",
      path: "stories/01-backlog",
      cards: [{ id: "us-001-start.md", title: "Start", complexity: "M" }]
    });
  });

  it("moves a markdown card between local folders", async () => {
    const sourceFile = new MemoryFileHandle("us-001-start.md", "# US-001 - Start");
    const done = new MemoryDirectoryHandle("02-done");
    const root = new MemoryDirectoryHandle("stories", {
      "01-backlog": new MemoryDirectoryHandle("01-backlog", {
        "us-001-start.md": sourceFile
      }),
      "02-done": done
    });

    await new BrowserKanbanRepository(root).moveCard({
      cardId: "us-001-start.md",
      fromColumnId: "01-backlog",
      toColumnId: "02-done"
    });

    const movedFile = await done.getFileHandle("us-001-start.md");

    await expect((await movedFile.getFile()).text()).resolves.toBe("# US-001 - Start");
    expect(sourceFile.removed).toBe(true);
  });

  it("reports File System Access API support", () => {
    vi.stubGlobal("window", {});

    expect(isFileSystemAccessSupported()).toBe(false);

    vi.stubGlobal("window", { showDirectoryPicker: vi.fn() });

    expect(isFileSystemAccessSupported()).toBe(true);
  });

  it("requires read and write permission", async () => {
    const root = new MemoryDirectoryHandle("stories");
    root.permission = "denied";

    await expect(ensureReadWritePermission(root)).rejects.toThrow("Permissao");
  });

  it("picks and stores a local folder handle", async () => {
    const root = new MemoryDirectoryHandle("stories");
    const store = new Map<string, unknown>();
    vi.stubGlobal("indexedDB", createIndexedDb(store));
    vi.stubGlobal("window", { showDirectoryPicker: vi.fn().mockResolvedValue(root) });

    const repository = await pickBrowserKanbanRepository();

    expect(repository.rootName).toBe("stories");
    expect(store.get("root-directory")).toBe(root);
  });

  it("loads a stored local folder handle", async () => {
    const root = new MemoryDirectoryHandle("stories");
    const store = new Map<string, unknown>([["root-directory", root]]);
    vi.stubGlobal("indexedDB", createIndexedDb(store));
    vi.stubGlobal("window", { showDirectoryPicker: vi.fn() });

    await expect(loadStoredBrowserKanbanRepository()).resolves.toMatchObject({ rootName: "stories" });
  });
});

function createIndexedDb(store: Map<string, unknown>) {
  return {
    open: () => {
      const request = createRequest(createDatabase(store));
      queueMicrotask(() => {
        request.onupgradeneeded?.({} as IDBVersionChangeEvent);
        request.onsuccess?.({} as Event);
      });
      return request;
    }
  } as IDBFactory;
}

function createDatabase(store: Map<string, unknown>) {
  return {
    createObjectStore: vi.fn(),
    close: vi.fn(),
    transaction: () => ({
      objectStore: () => ({
        put: (value: unknown, key: string) => createAsyncRequest(store.set(key, value).get(key)),
        get: (key: string) => createAsyncRequest(store.get(key))
      })
    })
  } as unknown as IDBDatabase;
}

function createAsyncRequest<T>(result: T) {
  const request = createRequest(result);
  queueMicrotask(() => request.onsuccess?.({} as Event));
  return request;
}

function createRequest<T>(result: T) {
  return {
    result,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  } as unknown as IDBOpenDBRequest;
}
