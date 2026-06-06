import { useEffect, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { KanbanBoard, MoveCardInput } from "@/src/domain/kanban";

export type KanbanViewModel = ReturnType<typeof useKanbanViewModel>;

type UseKanbanViewModelOptions = {
  moveCard?: (input: MoveCardInput) => Promise<void>;
};

export function useKanbanViewModel(initialBoard: KanbanBoard, options: UseKanbanViewModelOptions = {}) {
  const [board, setBoard] = useState(initialBoard);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    setBoard(initialBoard);
    setSelectedCardId("");
  }, [initialBoard]);

  const selectedCard = useMemo(
    () => board.columns.flatMap((column) => column.cards).find((card) => card.id === selectedCardId) ?? null,
    [board, selectedCardId]
  );

  async function handleDragEnd(event: DragEndEvent) {
    const cardId = String(event.active.id);
    const toColumnId = String(event.over?.id ?? "");
    const fromColumn = board.columns.find((column) => column.cards.some((card) => card.id === cardId));

    if (!fromColumn || !toColumnId || fromColumn.id === toColumnId) return;

    const nextBoard = moveCardLocally(board, cardId, fromColumn.id, toColumnId);
    setBoard(nextBoard);
    setIsMoving(true);

    try {
      await options.moveCard?.({ cardId, fromColumnId: fromColumn.id, toColumnId });
    } catch {
      setBoard(board);
    }

    setIsMoving(false);
  }

  return {
    board,
    selectedCard,
    isMoving,
    selectCard: setSelectedCardId,
    replaceBoard: setBoard,
    handleDragEnd
  };
}

export function moveCardLocally(board: KanbanBoard, cardId: string, fromColumnId: string, toColumnId: string) {
  const fromColumn = board.columns.find((column) => column.id === fromColumnId);
  const movingCard = fromColumn?.cards.find((card) => card.id === cardId);

  if (!movingCard) return board;

  const columns = board.columns.map((column) => {
    if (column.id !== fromColumnId) return column;
    return { ...column, cards: column.cards.filter((card) => card.id !== cardId) };
  });

  return {
    columns: columns.map((column) =>
      column.id === toColumnId
        ? { ...column, cards: [...column.cards, { ...movingCard, columnId: toColumnId }] }
        : column
    )
  };
}
