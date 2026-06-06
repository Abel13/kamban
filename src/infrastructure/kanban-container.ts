import { GetBoardUseCase } from "@/src/application/get-board";
import { MoveCardUseCase } from "@/src/application/move-card";
import { FileKanbanRepository } from "./file-kanban-repository";
import { getKanbanRootDir, setKanbanRootDir } from "./kanban-root-config";

async function createRepository() {
  return new FileKanbanRepository(await getKanbanRootDir());
}

export const kanbanContainer = {
  getBoard: {
    async execute() {
      return new GetBoardUseCase(await createRepository()).execute();
    }
  },
  moveCard: {
    async execute(input: Parameters<MoveCardUseCase["execute"]>[0]) {
      return new MoveCardUseCase(await createRepository()).execute(input);
    }
  },
  rootDir: {
    get: getKanbanRootDir,
    set: setKanbanRootDir
  }
};
