import { describe, expect, it } from "vitest";
import { getPickerCommands } from "./system-folder-picker";

describe("getPickerCommands", () => {
  it("uses osascript on macOS", () => {
    expect(getPickerCommands("darwin")[0]).toMatchObject({
      command: "/usr/bin/osascript"
    });
  });

  it("uses PowerShell on Windows", () => {
    expect(getPickerCommands("win32")[0]).toMatchObject({
      command: "powershell.exe"
    });
  });

  it("uses common Linux folder pickers", () => {
    expect(getPickerCommands("linux").map((command) => command.command)).toEqual(["zenity", "kdialog"]);
  });
});
