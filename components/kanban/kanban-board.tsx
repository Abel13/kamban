"use client";

import { useEffect, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CheckCircle2,
  Columns3,
  FileText,
  Flag,
  FolderOpen,
  Gauge,
  GitBranch,
  GripVertical,
  Loader2,
  RotateCw,
  X
} from "lucide-react";
import { format } from "date-fns";
import type { KanbanBoard as Board, KanbanCard as Card, KanbanColumn as Column } from "@/src/domain/kanban";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BrowserKanbanRepository,
  isFileSystemAccessSupported,
  loadStoredBrowserKanbanRepository,
  pickBrowserKanbanRepository
} from "@/src/infrastructure/browser-kanban-repository";
import { cn } from "@/src/lib/utils";
import { useKanbanViewModel } from "@/src/view-models/kanban-view-model";

type Props = {
  initialBoard: Board;
};

export function KanbanBoard({ initialBoard }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [repository, setRepository] = useState<BrowserKanbanRepository | null>(null);
  const [rootLabel, setRootLabel] = useState("");
  const [rootPickerError, setRootPickerError] = useState("");
  const [pickingRoot, setPickingRoot] = useState(false);
  const [loadingStoredRoot, setLoadingStoredRoot] = useState(true);
  const [activeCardId, setActiveCardId] = useState("");
  const vm = useKanbanViewModel(initialBoard, {
    moveCard: (input) => {
      if (!repository) throw new Error("Nenhuma pasta selecionada.");
      return repository.moveCard(input);
    }
  });
  const activeCard = vm.board.columns.flatMap((column) => column.cards).find((card) => card.id === activeCardId) ?? null;

  useEffect(() => {
    let isMounted = true;

    async function loadStoredRoot() {
      try {
        const storedRepository = await loadStoredBrowserKanbanRepository();
        if (!isMounted || !storedRepository) return;

        setRepository(storedRepository);
        setRootLabel(storedRepository.rootName);
        vm.replaceBoard(await storedRepository.getBoard());
      } catch {
        if (isMounted) {
          setRootPickerError("Nao foi possivel reabrir a pasta salva. Selecione a pasta novamente.");
        }
      } finally {
        if (isMounted) {
          setLoadingStoredRoot(false);
        }
      }
    }

    loadStoredRoot();

    return () => {
      isMounted = false;
    };
  }, []);

  async function pickRootFolder() {
    if (!isFileSystemAccessSupported()) {
      setRootPickerError("Este navegador nao permite acesso local a pastas. Use Chrome ou Edge.");
      return;
    }

    setPickingRoot(true);
    setRootPickerError("");

    try {
      const nextRepository = await pickBrowserKanbanRepository();
      const nextBoard = await nextRepository.getBoard();

      setRepository(nextRepository);
      setRootLabel(nextRepository.rootName);
      vm.replaceBoard(nextBoard);
    } catch (error) {
      setRootPickerError(error instanceof Error ? error.message : "Nao foi possivel selecionar a pasta.");
    } finally {
      setPickingRoot(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--muted)]">Pasta do kanban</p>
          <p className="mt-1 truncate text-sm text-slate-200">
            {rootLabel || (loadingStoredRoot ? "Procurando pasta salva..." : "Nenhuma pasta selecionada")}
          </p>
          {rootPickerError && <p className="mt-1 text-xs text-red-200">{rootPickerError}</p>}
        </div>
        <Button className="shrink-0" onClick={pickRootFolder} disabled={pickingRoot}>
          {pickingRoot ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
          Selecionar pasta
        </Button>
      </div>
      {!repository && !loadingStoredRoot && (
        <section className="grid min-h-0 flex-1 place-items-center rounded-lg border border-dashed border-slate-700 bg-[var(--surface)] p-6 text-center">
          <div className="max-w-md">
            <FolderOpen className="mx-auto h-10 w-10 text-slate-500" />
            <h2 className="mt-4 text-lg font-semibold text-white">Selecione uma pasta local</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              A pasta raiz deve conter uma subpasta por coluna e arquivos `.md` de user story dentro delas.
            </p>
            <Button className="mt-5" onClick={pickRootFolder} disabled={pickingRoot}>
              {pickingRoot ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              Selecionar pasta
            </Button>
          </div>
        </section>
      )}
      {(repository || loadingStoredRoot) && (
      <DndContext
        sensors={sensors}
        onDragStart={(event) => setActiveCardId(String(event.active.id))}
        onDragCancel={() => setActiveCardId("")}
        onDragEnd={async (event) => {
          await vm.handleDragEnd(event);
          setActiveCardId("");
        }}
      >
        <section className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2">
          {vm.board.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} selectedId={vm.selectedCard?.id} onSelect={vm.selectCard} />
          ))}
        </section>
        <DragOverlay dropAnimation={null}>
          {activeCard ? <KanbanCardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
      )}
      <CardDetailsPanel card={vm.selectedCard} isMoving={vm.isMoving} onClose={() => vm.selectCard("")} />
    </div>
  );
}

function KanbanColumn({ column, selectedId, onSelect }: { column: Column; selectedId?: string; onSelect: (id: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-[min(22rem,calc(100vw-2rem))] flex-none flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors sm:w-[22rem]",
        isOver && "border-sky-400 bg-sky-950/30"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-3">
        <h2 className="text-sm font-semibold text-slate-100">{column.name}</h2>
        <span className="grid h-7 min-w-7 place-items-center rounded-md bg-slate-800 px-2 text-xs text-slate-300">
          {column.cards.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} selected={selectedId === card.id} onSelect={onSelect} />
        ))}
        {column.cards.length === 0 && (
          <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-slate-700 text-xs text-slate-500">
            Sem cards
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = isDragging ? undefined : { transform: CSS.Translate.toString(transform) };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-[var(--surface-strong)] p-3 shadow-sm transition",
        selected ? "border-sky-400" : "border-slate-700/80",
        isDragging && "opacity-25"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          aria-label="Arrastar card"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(card.id)}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{card.usNumber}</Badge>
            <PriorityBadge priority={card.priority} />
            <ComplexityIcon complexity={card.complexity} />
            {card.dependencies.blocking.length > 0 && <BlockingDependenciesBadge count={card.dependencies.blocking.length} />}
          </div>
          <h3 className="mt-3 text-sm font-semibold leading-5 text-white">{card.title}</h3>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(card.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </button>
      </div>
    </article>
  );
}

function KanbanCardOverlay({ card }: { card: Card }) {
  return (
    <article className="w-[min(20.5rem,calc(100vw-3.5rem))] rotate-[0.5deg] rounded-lg border border-sky-400 bg-[var(--surface-strong)] p-3 shadow-2xl shadow-sky-950/60 ring-1 ring-sky-400/30">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-300">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{card.usNumber}</Badge>
            <PriorityBadge priority={card.priority} />
            <ComplexityIcon complexity={card.complexity} />
            {card.dependencies.blocking.length > 0 && <BlockingDependenciesBadge count={card.dependencies.blocking.length} />}
          </div>
          <h3 className="mt-3 text-sm font-semibold leading-5 text-white">{card.title}</h3>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(card.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </div>
    </article>
  );
}

function CardDetailsPanel({ card, isMoving, onClose }: { card: Card | null; isMoving: boolean; onClose: () => void }) {
  if (!card) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 p-3 backdrop-blur-sm sm:p-5" role="presentation">
      <button className="absolute inset-0 cursor-default" aria-label="Fechar detalhes" onClick={onClose} />
      <aside
        className="relative flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-details-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <Badge variant="info">{card.usNumber}</Badge>
            <h2 id="card-details-title" className="mt-3 text-xl font-semibold leading-7 text-white">
              {card.title}
            </h2>
          </div>
          <Button variant="ghost" aria-label="Fechar detalhes" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 md:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <FileText className="h-4 w-4" />
              Historia
            </h3>
            <div className="space-y-4 text-sm leading-6 text-slate-300">
              {Object.entries(card.sections).map(([title, content]) => (
                <section key={title}>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</h4>
                  <MarkdownSectionContent content={content} />
                </section>
              ))}
            </div>
          </div>
          <StoryMetaCard card={card} isMoving={isMoving} />
        </div>
      </aside>
    </div>
  );
}

function MarkdownSectionContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split(/\r?\n/).filter(Boolean);
        const listItems = parseMarkdownListItems(lines);

        if (listItems.length > 0) {
          return (
            <ul key={blockIndex} className="space-y-1.5">
              {listItems.map((item, lineIndex) => (
                <MarkdownListItem key={`${blockIndex}-${lineIndex}`} item={item} />
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

type MarkdownListItemModel = {
  checked?: boolean;
  text: string;
};

function parseMarkdownListItems(lines: string[]): MarkdownListItemModel[] {
  if (!lines.some((line) => /^-\s+/.test(line.trim()))) return [];

  const items: MarkdownListItemModel[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const checkbox = trimmed.match(/^-\s+\[( |x|X)\]\s+(.+)$/);
    const bullet = trimmed.match(/^-\s+(.+)$/);

    if (checkbox) {
      items.push({ checked: checkbox[1].toLowerCase() === "x", text: checkbox[2] });
      continue;
    }

    if (bullet) {
      items.push({ text: bullet[1] });
      continue;
    }

    const current = items.at(-1);
    if (!current) return [];

    current.text = `${current.text}\n${trimmed}`;
  }

  return items;
}

function MarkdownListItem({ item }: { item: MarkdownListItemModel }) {
  if (item.checked !== undefined) {
    return (
      <li className="flex gap-2">
        <input
          type="checkbox"
          checked={item.checked}
          readOnly
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 accent-sky-400"
          aria-label={item.checked ? "Item concluido" : "Item pendente"}
        />
        <span className={cn("min-w-0 whitespace-pre-line", item.checked && "text-slate-500 line-through")}>{item.text}</span>
      </li>
    );
  }

  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
      <span className="min-w-0 whitespace-pre-line">{item.text}</span>
    </li>
  );
}

function StoryMetaCard({ card, isMoving }: { card: Card; isMoving: boolean }) {
  return (
    <section className="h-fit rounded-lg border border-slate-800 bg-slate-950/25 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase text-slate-500">Dados</h3>
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-md border",
            isMoving
              ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          )}
          title={isMoving ? "Salvando movimento" : "Sincronizado"}
          aria-label={isMoving ? "Salvando movimento" : "Sincronizado"}
        >
          {isMoving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="grid gap-2">
        <MetaSignal icon={<Flag className="h-4 w-4" />} label="Prioridade" value={<PriorityBadge priority={card.priority} />} />
        <MetaSignal
          icon={<Gauge className="h-4 w-4 rotate-90" />}
          label="Complexidade"
          value={<ComplexityIcon complexity={card.complexity} />}
        />
        <MetaSignal
          icon={<GitBranch className="h-4 w-4" />}
          label="Dependencias bloqueantes"
          value={<DependencyList dependencies={card.dependencies.blocking} emptyLabel="nenhuma" />}
        />
        <MetaSignal
          icon={<GitBranch className="h-4 w-4" />}
          label="Dependencias nao bloqueantes"
          value={<DependencyList dependencies={card.dependencies.nonBlocking} emptyLabel="nenhuma" />}
        />
        <MetaSignal icon={<Columns3 className="h-4 w-4" />} label="Status" value={formatStatus(card.columnId)} />
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {format(new Date(card.createdAt), "dd/MM/yyyy HH:mm")}
        </p>
        <p className="truncate" title={card.fileName}>
          {card.fileName}
        </p>
        {card.source.length > 0 && (
          <p className="line-clamp-2" title={card.source.join(", ")}>
            {card.source.join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}

function MetaSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/45 p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-800 text-slate-300">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase text-slate-500">{label}</p>
        <div className="mt-1 min-w-0 break-words text-sm font-medium text-slate-100">{value}</div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Card["priority"] }) {
  const variant = priority === "P0" ? "danger" : priority === "P1" ? "warning" : priority === "P2" ? "success" : "neutral";
  return <Badge variant={variant}>{priority}</Badge>;
}

function BlockingDependenciesBadge({ count }: { count: number }) {
  return (
    <Badge variant="danger" title={`${count} dependencia(s) bloqueante(s)`}>
      {count} bloqueio{count > 1 ? "s" : ""}
    </Badge>
  );
}

function ComplexityIcon({ complexity }: { complexity: Card["complexity"] }) {
  const filledCount = getComplexityWeight(complexity);

  return (
    <span
      className="inline-flex h-6 items-center gap-0.5 rounded-md border border-slate-600 bg-slate-800/70 px-2"
      aria-label={`Complexidade ${complexity}`}
      title={`Complexidade ${complexity}`}
    >
      <span className="sr-only">Complexidade {complexity}</span>
      {Array.from({ length: 4 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "block h-2.5 w-1.5 rounded-sm",
            index < filledCount ? "bg-sky-300" : "bg-slate-600/70",
            complexity === "N/A" && "bg-slate-700"
          )}
        />
      ))}
    </span>
  );
}

function getComplexityWeight(complexity: Card["complexity"]) {
  const weights: Record<Card["complexity"], number> = {
    P: 1,
    M: 2,
    G: 3,
    GG: 4,
    "N/A": 0
  };

  return weights[complexity];
}

function DependencyList({ dependencies, emptyLabel }: { dependencies: string[]; emptyLabel: string }) {
  if (dependencies.length === 0) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {dependencies.map((dependency) => (
        <Badge key={dependency} variant="neutral">
          {dependency}
        </Badge>
      ))}
    </span>
  );
}

function formatStatus(columnId: string) {
  return columnId
    .replace(/^\d+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
