import { describe, expect, it, vi } from "vitest";
import { MoveCardUseCase } from "./move-card";
import type { KanbanRepository } from "@/src/domain/kanban";

function repositoryMock(): KanbanRepository {
  return {
    getBoard: vi.fn(),
    moveCard: vi.fn()
  };
}

describe("MoveCardUseCase", () => {
  it("does not call repository when card stays in the same column", async () => {
    const repository = repositoryMock();
    const useCase = new MoveCardUseCase(repository);

    await useCase.execute({ cardId: "card", fromColumnId: "todo", toColumnId: "todo" });

    expect(repository.moveCard).not.toHaveBeenCalled();
  });

  it("delegates valid moves to repository", async () => {
    const repository = repositoryMock();
    const useCase = new MoveCardUseCase(repository);
    const input = { cardId: "card", fromColumnId: "todo", toColumnId: "done" };

    await useCase.execute(input);

    expect(repository.moveCard).toHaveBeenCalledWith(input);
  });
});
