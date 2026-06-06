import { KanbanBoard } from "@/components/kanban/kanban-board";
import { kanbanContainer } from "@/src/infrastructure/kanban-container";

export async function BoardPage() {
  const [board, rootDir] = await Promise.all([kanbanContainer.getBoard.execute(), kanbanContainer.rootDir.get()]);

  return (
    <main className="h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 max-w-[1600px] flex-col gap-5">
        <header className="shrink-0 border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-sm font-medium text-[var(--info)]">Local markdown board</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Kamban</h1>
          </div>
        </header>
        <KanbanBoard initialBoard={board} initialRootDir={rootDir} />
      </div>
    </main>
  );
}
