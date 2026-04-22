import type { ScanProgress } from "../types/scan-progress.js";
import type { ScanResultItem } from "../types/scan-result-item.js";
import type { ScanTask } from "../types/scan-task.js";
import type { ScanTarget } from "../types/scan-target.js";

export interface GetScanTargetsResponse {
  targets: ScanTarget[];
}

export interface RevealInFolderPayload {
  path: string;
}

export interface StartScanPayload {
  targetPath: string;
  mode: "quick" | "deep";
}

export interface StartScanResponse {
  task: ScanTask;
}

export interface ScanProgressEvent {
  progress: ScanProgress;
}

export interface ScanResultBatchEvent {
  taskId: string;
  items: ScanResultItem[];
}
