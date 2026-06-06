const userStoryFilePattern = /^us-\d{3}-.+\.md$/i;

export function createCardId(columnId: string, fileName: string) {
  void columnId;
  return fileName;
}

export function isUserStoryFileName(fileName: string) {
  return userStoryFilePattern.test(fileName);
}

export function formatColumnName(folderName: string) {
  return folderName
    .replace(/^\d+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
