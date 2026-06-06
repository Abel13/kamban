const userStoryFilePattern = /^us-\d{3}-.+\.md$/i;
const canonicalColumnOrder = ["backlog", "to-do", "doing", "reviewing", "done"];

export function createCardId(columnId: string, fileName: string) {
  void columnId;
  return fileName;
}

export function isUserStoryFileName(fileName: string) {
  return userStoryFilePattern.test(fileName);
}

export function compareColumnFolderNames(left: string, right: string) {
  const leftIndex = canonicalColumnOrder.indexOf(normalizeColumnId(left));
  const rightIndex = canonicalColumnOrder.indexOf(normalizeColumnId(right));

  if (leftIndex >= 0 && rightIndex >= 0) {
    return leftIndex - rightIndex;
  }

  if (leftIndex >= 0) return -1;
  if (rightIndex >= 0) return 1;

  return left.localeCompare(right);
}

export function formatColumnName(folderName: string) {
  return folderName
    .replace(/^\d+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeColumnId(folderName: string) {
  return folderName.replace(/^\d+[-_]/, "").toLowerCase();
}
