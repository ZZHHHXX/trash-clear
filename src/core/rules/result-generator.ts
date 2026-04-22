import type { ScanResultItem } from "../../shared/types/scan-result-item.js";
import type { FileMetadata } from "../scanner/metadata-reader.js";
import type { ScanTask } from "../../shared/types/scan-task.js";
import { evaluateFile } from "./rule-engine.js";

export function createResultItem(task: ScanTask, metadata: FileMetadata, ordinal: number): ScanResultItem | null {
  const { selected } = evaluateFile(metadata);

  if (selected.protected) {
    return null;
  }

  return {
    id: `${task.id}-${ordinal}`,
    taskId: task.id,
    name: metadata.name,
    path: metadata.path,
    extension: metadata.extension,
    size: metadata.size,
    modifiedAt: metadata.modifiedAt,
    purpose: selected.purpose,
    reason: selected.reason,
    riskLevel: selected.riskLevel,
    allowDelete: selected.allowDelete
  };
}
