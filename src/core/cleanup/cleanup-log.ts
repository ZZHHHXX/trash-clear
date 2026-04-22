import type { CleanupItemRequest, CleanupItemResult, CleanupLogEntry } from "../../shared/ipc/cleanup-ipc.js";

export function createCleanupLogEntry(
  request: CleanupItemRequest,
  result: CleanupItemResult,
  taskId?: string
): CleanupLogEntry {
  return {
    id: `${request.id}-${Date.now()}`,
    taskId,
    path: request.path,
    name: request.name,
    size: request.size,
    status: result.status,
    message: result.message,
    createdAt: new Date().toISOString()
  };
}
