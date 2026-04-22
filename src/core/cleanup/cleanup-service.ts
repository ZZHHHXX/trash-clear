import { access } from "node:fs/promises";
import type { CleanupItemRequest, CleanupItemResult, CleanupRequest, CleanupResponse } from "../../shared/ipc/cleanup-ipc.js";
import { appendCleanupLogs } from "../storage/log-store.js";
import { createCleanupLogEntry } from "./cleanup-log.js";
import { validateCleanupItem } from "./delete-guard.js";
import { moveToRecycleBin } from "./recycle-bin.js";

async function cleanupItem(request: CleanupItemRequest): Promise<CleanupItemResult> {
  const guard = validateCleanupItem(request);

  if (!guard.allowed) {
    return {
      id: request.id,
      path: request.path,
      status: "skipped",
      message: guard.message
    };
  }

  try {
    await access(request.path);
  } catch {
    return {
      id: request.id,
      path: request.path,
      status: "failed",
      message: "目标文件不存在或当前不可访问。"
    };
  }

  try {
    await moveToRecycleBin(request.path);
    return {
      id: request.id,
      path: request.path,
      status: "deleted",
      message: "已移动到回收站。"
    };
  } catch (error) {
    return {
      id: request.id,
      path: request.path,
      status: "failed",
      message: error instanceof Error ? error.message : "移动到回收站失败。"
    };
  }
}

export async function executeCleanup(request: CleanupRequest): Promise<CleanupResponse> {
  const results: CleanupItemResult[] = [];
  const logs = [];
  let deletedCount = 0;
  let releasedBytes = 0;

  for (const item of request.items) {
    const result = await cleanupItem(item);
    results.push(result);
    logs.push(createCleanupLogEntry(item, result, request.taskId));

    if (result.status === "deleted") {
      deletedCount += 1;
      releasedBytes += item.size;
    }
  }

  await appendCleanupLogs(logs);

  return {
    results,
    deletedCount,
    releasedBytes
  };
}
