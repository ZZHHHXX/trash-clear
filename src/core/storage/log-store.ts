import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { app } from "electron";
import type { CleanupLogEntry } from "../../shared/ipc/cleanup-ipc.js";

function resolveLogFilePath() {
  return join(app.getPath("userData"), "cleanup-logs.json");
}

async function readExistingLogs() {
  const filePath = resolveLogFilePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as CleanupLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendCleanupLogs(entries: CleanupLogEntry[]) {
  if (entries.length === 0) {
    return;
  }

  const filePath = resolveLogFilePath();
  await mkdir(dirname(filePath), { recursive: true });

  const existing = await readExistingLogs();
  const merged = [...entries, ...existing].slice(0, 1000);
  await writeFile(filePath, JSON.stringify(merged, null, 2), "utf8");
}
