import { TaskStatus } from "../enums/task-status.js";

export interface ScanProgress {
  taskId: string;
  status: TaskStatus;
  scannedFileCount: number;
  candidateCount: number;
  releasedBytesEstimate: number;
  currentPath?: string;
  progressPercent?: number;
}
