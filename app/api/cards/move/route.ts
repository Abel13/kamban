import { NextResponse } from "next/server";
import { kanbanContainer } from "@/src/infrastructure/kanban-container";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await kanbanContainer.moveCard.execute({
      cardId: String(body.cardId),
      fromColumnId: String(body.fromColumnId),
      toColumnId: String(body.toColumnId)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unexpected error." },
      { status: 400 }
    );
  }
}
