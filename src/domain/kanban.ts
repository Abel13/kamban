export type Priority = "P0" | "P1" | "P2" | "P3" | "PX";
export type Complexity = "P" | "M" | "G" | "GG" | "N/A";

export type CardDependencies = {
  blocking: string[];
  nonBlocking: string[];
};

export type KanbanCard = {
  id: string;
  fileName: string;
  columnId: string;
  title: string;
  usNumber: string;
  priority: Priority;
  complexity: Complexity;
  dependencies: CardDependencies;
  source: string[];
  createdAt: string;
  body: string;
  sections: Record<string, string>;
};

export type KanbanColumn = {
  id: string;
  name: string;
  path: string;
  cards: KanbanCard[];
};

export type KanbanBoard = {
  columns: KanbanColumn[];
};

export type MoveCardInput = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
};

export interface KanbanRepository {
  getBoard(): Promise<KanbanBoard>;
  moveCard(input: MoveCardInput): Promise<void>;
}
