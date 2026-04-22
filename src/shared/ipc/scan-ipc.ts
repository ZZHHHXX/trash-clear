import type { ScanProgress } from "../types/scan-progress.js";
import type { ScanResultItem } from "../types/scan-result-item.js";
import type { ScanTask } from "../types/scan-task.js";

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
