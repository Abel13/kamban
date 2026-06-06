import { describe, expect, it, vi } from "vitest";
import { GetBoardUseCase } from "./get-board";
import type { KanbanRepository } from "@/src/domain/kanban";

describe("GetBoardUseCase", () => {
  it("returns the board from the repository", async () => {
    const board = { columns: [] };
    const repository: KanbanRepository = {
      getBoard: vi.fn().mockResolvedValue(board),
      moveCard: vi.fn()
    };

    await expect(new GetBoardUseCase(repository).execute()).resolves.toBe(board);
  });
});
