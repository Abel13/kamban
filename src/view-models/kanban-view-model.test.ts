import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { KanbanBoard } from "@/src/domain/kanban";
import { moveCardLocally, useKanbanViewModel } from "./kanban-view-model";

const board: KanbanBoard = {
  columns: [
    {
      id: "todo",
      name: "Todo",
      path: "/todo",
      cards: [
        {
          id: "todo:a.md",
          fileName: "a.md",
          columnId: "todo",
          title: "A",
          usNumber: "US-001",
          priority: "P0",
          complexity: "M",
          dependencies: { blocking: [], nonBlocking: [] },
          source: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          body: "",
          sections: {}
        }
      ]
    },
    { id: "done", name: "Done", path: "/done", cards: [] }
  ]
};

const otherBoard: KanbanBoard = {
  columns: [
    {
      id: "selected",
      name: "Selected",
      path: "/selected",
      cards: [
        {
          id: "selected:b.md",
          fileName: "b.md",
          columnId: "selected",
          title: "B",
          usNumber: "US-002",
          priority: "P1",
          complexity: "P",
          dependencies: { blocking: [], nonBlocking: [] },
          source: [],
          createdAt: "2026-01-02T00:00:00.000Z",
          body: "",
          sections: {}
        }
      ]
    }
  ]
};

describe("moveCardLocally", () => {
  it("moves a card to the target column without mutating the original board", () => {
    const moved = moveCardLocally(board, "todo:a.md", "todo", "done");

    expect(moved.columns[0].cards).toHaveLength(0);
    expect(moved.columns[1].cards[0]).toMatchObject({ id: "todo:a.md", columnId: "done" });
    expect(board.columns[0].cards).toHaveLength(1);
  });

  it("returns the original board when the card does not exist", () => {
    expect(moveCardLocally(board, "missing", "todo", "done")).toBe(board);
  });
});

describe("useKanbanViewModel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts without an open card and changes selection", () => {
    const { result } = renderHook(() => useKanbanViewModel(board));

    expect(result.current.selectedCard).toBeNull();

    act(() => result.current.selectCard("todo:a.md"));

    expect(result.current.selectedCard?.id).toBe("todo:a.md");
  });

  it("syncs local state when the board changes", () => {
    const { result, rerender } = renderHook(({ initialBoard }) => useKanbanViewModel(initialBoard), {
      initialProps: { initialBoard: board }
    });

    act(() => result.current.selectCard("todo:a.md"));

    expect(result.current.selectedCard?.id).toBe("todo:a.md");

    rerender({ initialBoard: otherBoard });

    expect(result.current.board.columns[0].id).toBe("selected");
    expect(result.current.selectedCard).toBeNull();
  });

  it("persists a drag move through the configured repository", async () => {
    const moveCard = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useKanbanViewModel(board, { moveCard }));

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: "todo:a.md" },
        over: { id: "done" }
      } as Parameters<typeof result.current.handleDragEnd>[0]);
    });

    expect(result.current.board.columns[1].cards[0].columnId).toBe("done");
    expect(moveCard).toHaveBeenCalledWith({ cardId: "todo:a.md", fromColumnId: "todo", toColumnId: "done" });
  });

  it("rolls back when the repository rejects the move", async () => {
    const { result } = renderHook(() =>
      useKanbanViewModel(board, {
        moveCard: vi.fn().mockRejectedValue(new Error("failed"))
      })
    );

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: "todo:a.md" },
        over: { id: "done" }
      } as Parameters<typeof result.current.handleDragEnd>[0]);
    });

    await waitFor(() => expect(result.current.board.columns[0].cards).toHaveLength(1));
  });

  it("ignores invalid drags", async () => {
    const moveCard = vi.fn();
    const { result } = renderHook(() => useKanbanViewModel(board, { moveCard }));

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: "todo:a.md" },
        over: { id: "todo" }
      } as Parameters<typeof result.current.handleDragEnd>[0]);
    });

    expect(moveCard).not.toHaveBeenCalled();
  });
});
