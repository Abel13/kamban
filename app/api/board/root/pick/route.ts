import { NextResponse } from "next/server";
import { kanbanContainer } from "@/src/infrastructure/kanban-container";
import { pickSystemFolder } from "@/src/infrastructure/system-folder-picker";

export async function POST() {
  try {
    const pickedRootDir = await pickSystemFolder();
    const rootDir = await kanbanContainer.rootDir.set(pickedRootDir);

    return NextResponse.json({ rootDir });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Nao foi possivel selecionar a pasta." },
      { status: 400 }
    );
  }
}
