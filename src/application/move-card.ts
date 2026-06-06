import type { KanbanRepository, MoveCardInput } from "@/src/domain/kanban";

export class MoveCardUseCase {
  constructor(private readonly repository: KanbanRepository) {}

  async execute(input: MoveCardInput): Promise<void> {
    if (input.fromColumnId === input.toColumnId) return;
    await this.repository.moveCard(input);
  }
}
