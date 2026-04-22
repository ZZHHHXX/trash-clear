import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels.js";
import { TaskStatus } from "../../shared/enums/task-status.js";
import { ScanMode } from "../../shared/enums/scan-mode.js";
import type { ScanProgressEvent, ScanResultBatchEvent, StartScanPayload } from "../../shared/ipc/scan-ipc.js";
import type { ScanTask } from "../../shared/types/scan-task.js";
import { scanDisk } from "../scanner/disk-scanner.js";

const scanTasks = new Map<string, ScanTask>();

function emitProgress(targetWindow: BrowserWindow, progress: ScanProgressEvent) {
  targetWindow.webContents.send(IPC_CHANNELS.scan.progress, progress);
}

function emitResultBatch(targetWindow: BrowserWindow, payload: ScanResultBatchEvent) {
  targetWindow.webContents.send(IPC_CHANNELS.scan.resultBatch, payload);
}

export function createScanTask(payload: StartScanPayload) {
  const task: ScanTask = {
    id: `scan-${Date.now()}`,
    targetPath: payload.targetPath,
    mode: payload.mode === "deep" ? ScanMode.Deep : ScanMode.Quick,
    status: TaskStatus.Pending,
    createdAt: new Date().toISOString()
  };

  scanTasks.set(task.id, task);
  return task;
}

export function runScanTask(task: ScanTask, targetWindow: BrowserWindow) {
  task.status = TaskStatus.Running;
  task.startedAt = new Date().toISOString();

  void scanDisk(task, {
    onProgress(progress) {
      emitProgress(targetWindow, { progress });
    },
    onResultBatch(taskId, items) {
      emitResultBatch(targetWindow, { taskId, items });
    },
    onCompleted(finalProgress) {
      task.status = TaskStatus.Completed;
      task.finishedAt = new Date().toISOString();
      emitProgress(targetWindow, {
        progress: {
          ...finalProgress,
          status: TaskStatus.Completed,
          progressPercent: 100
        }
      });
    }
  }).catch(() => {
    task.status = TaskStatus.Failed;
    task.finishedAt = new Date().toISOString();
    emitProgress(targetWindow, {
      progress: {
        taskId: task.id,
        status: TaskStatus.Failed,
        scannedFileCount: 0,
        candidateCount: 0,
        releasedBytesEstimate: 0,
        currentPath: task.targetPath
      }
    });
  });
}
