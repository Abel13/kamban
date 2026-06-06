import { NextResponse } from "next/server";
import { kanbanContainer } from "@/src/infrastructure/kanban-container";

export async function GET() {
  const rootDir = await kanbanContainer.rootDir.get();
  return NextResponse.json({ rootDir });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rootDir = await kanbanContainer.rootDir.set(String(body.rootDir ?? ""));

    return NextResponse.json({ rootDir });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Nao foi possivel selecionar a pasta." },
      { status: 400 }
    );
  }
}
