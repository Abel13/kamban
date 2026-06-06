import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type CommandSpec = {
  command: string;
  args: string[];
};

export async function pickSystemFolder() {
  const specs = getPickerCommands(os.platform());
  let lastError: unknown;

  for (const spec of specs) {
    try {
      const { stdout } = await execFileAsync(spec.command, spec.args, { timeout: 120_000 });
      const folderPath = stdout.trim();

      if (folderPath) return folderPath;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getPickerErrorMessage(lastError));
}

export function getPickerCommands(platform: NodeJS.Platform): CommandSpec[] {
  if (platform === "darwin") {
    return [
      {
        command: "/usr/bin/osascript",
        args: ["-e", 'POSIX path of (choose folder with prompt "Selecione a pasta raiz do kanban")']
      }
    ];
  }

  if (platform === "win32") {
    return [
      {
        command: "powershell.exe",
        args: [
          "-NoProfile",
          "-Command",
          [
            "Add-Type -AssemblyName System.Windows.Forms;",
            "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog;",
            '$dialog.Description = "Selecione a pasta raiz do kanban";',
            "$dialog.ShowNewFolderButton = $true;",
            "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.SelectedPath }"
          ].join(" ")
        ]
      }
    ];
  }

  return [
    { command: "zenity", args: ["--file-selection", "--directory", "--title=Selecione a pasta raiz do kanban"] },
    { command: "kdialog", args: ["--getexistingdirectory", ".", "Selecione a pasta raiz do kanban"] }
  ];
}

function getPickerErrorMessage(error: unknown) {
  if (isCancelled(error)) return "Selecao de pasta cancelada.";
  return "Nao foi possivel abrir o seletor de pastas do sistema.";
}

function isCancelled(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "1" || code === "255";
}
