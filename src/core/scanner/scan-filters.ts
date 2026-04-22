import { basename } from "node:path";

const IGNORED_DIRECTORY_NAMES = new Set([
  "System Volume Information",
  "Recovery",
  "Config.Msi",
  "WindowsApps"
]);

const IGNORED_PREFIXES = [
  "C:\\Windows\\System32",
  "C:\\Program Files\\Windows Defender",
  "C:\\ProgramData\\Microsoft\\Windows\\WER"
];

export function shouldSkipPath(path: string) {
  const normalizedPath = path.replace(/\//g, "\\");
  const directoryName = basename(normalizedPath);

  if (IGNORED_DIRECTORY_NAMES.has(directoryName)) {
    return true;
  }

  return IGNORED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}
