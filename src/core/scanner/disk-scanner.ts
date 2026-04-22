import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ScanProgress } from "../../shared/types/scan-progress.js";
import type { ScanResultItem } from "../../shared/types/scan-result-item.js";
import type { ScanTask } from "../../shared/types/scan-task.js";
import { createResultItem } from "../rules/result-generator.js";
import { readFileMetadata } from "./metadata-reader.js";
import { resolveQuickScanPaths } from "./quick-scan-paths.js";
import { shouldSkipPath } from "./scan-filters.js";

const MAX_RESULTS = 500;
const RESULT_BATCH_SIZE = 25;

function normalizeDriveRoot(targetPath: string) {
  return (targetPath.endsWith("\\") ? targetPath : `${targetPath}\\`).slice(0, 3).toUpperCase();
}

function belongsToTargetDrive(path: string, driveRoot: string) {
  return path.replace(/\//g, "\\").toUpperCase().startsWith(driveRoot);
}

export interface ScanRuntimeEvents {
  onProgress: (progress: ScanProgress) => void;
  onResultBatch: (taskId: string, items: ScanResultItem[]) => void;
  onCompleted: (finalProgress: ScanProgress) => void;
}
function createProgress(
  task: ScanTask,
  scannedFileCount: number,
  candidateCount: number,
  releasedBytesEstimate: number,
  currentPath?: string
) {
  return {
    taskId: task.id,
    status: task.status,
    scannedFileCount,
    candidateCount,
    releasedBytesEstimate,
    currentPath,
    progressPercent: undefined
  } satisfies ScanProgress;
}

export async function scanDisk(task: ScanTask, events: ScanRuntimeEvents) {
  const targetDriveRoot = normalizeDriveRoot(task.targetPath);
  const scanRoots =
    task.mode === "quick"
      ? await resolveQuickScanPaths(task.targetPath)
      : [task.targetPath].filter((path) => belongsToTargetDrive(path, targetDriveRoot));

  let scannedFileCount = 0;
  let candidateCount = 0;
  let releasedBytesEstimate = 0;
  let pendingBatch: ScanResultItem[] = [];

  const flushBatch = () => {
    if (pendingBatch.length === 0) {
      return;
    }

    events.onResultBatch(task.id, pendingBatch);
    pendingBatch = [];
  };

  const visitDirectory = async (directoryPath: string): Promise<void> => {
    if (!belongsToTargetDrive(directoryPath, targetDriveRoot) || shouldSkipPath(directoryPath) || candidateCount >= MAX_RESULTS) {
      return;
    }

    let entries;

    try {
      entries = await readdir(directoryPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (candidateCount >= MAX_RESULTS) {
        break;
      }

      const entryPath = join(directoryPath, entry.name);

      if (!belongsToTargetDrive(entryPath, targetDriveRoot)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (!shouldSkipPath(entryPath)) {
          await visitDirectory(entryPath);
        }

        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      try {
        const metadata = await readFileMetadata(entryPath);
        const resultItem = createResultItem(task, metadata, scannedFileCount + 1);

        scannedFileCount += 1;

        if (resultItem) {
          candidateCount += 1;
          pendingBatch.push(resultItem);

          if (resultItem.allowDelete) {
            releasedBytesEstimate += resultItem.size;
          }
        }

        events.onProgress(createProgress(task, scannedFileCount, candidateCount, releasedBytesEstimate, entryPath));

        if (pendingBatch.length >= RESULT_BATCH_SIZE) {
          flushBatch();
        }
      } catch {
        continue;
      }
    }
  };

  events.onProgress(createProgress(task, scannedFileCount, candidateCount, releasedBytesEstimate, scanRoots[0]));

  for (const rootPath of scanRoots) {
    await visitDirectory(rootPath);
  }

  flushBatch();
  events.onCompleted(createProgress(task, scannedFileCount, candidateCount, releasedBytesEstimate));
}
