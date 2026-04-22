import { ScanMode } from "../enums/scan-mode.js";
import { TaskStatus } from "../enums/task-status.js";

export interface ScanTask {
  id: string;
  targetPath: string;
  mode: ScanMode;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}
