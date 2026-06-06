import type { KanbanBoard, KanbanRepository } from "@/src/domain/kanban";

export class GetBoardUseCase {
  constructor(private readonly repository: KanbanRepository) {}

  async execute(): Promise<KanbanBoard> {
    return this.repository.getBoard();
  }
}
