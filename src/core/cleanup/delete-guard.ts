import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { CleanupItemRequest } from "../../shared/ipc/cleanup-ipc.js";
import { isProtectedPath } from "../protection/safety-check.js";

export function validateCleanupItem(item: CleanupItemRequest) {
  if (!item.allowDelete) {
    return { allowed: false, message: "该条目当前被标记为不可删除。" };
  }

  if (item.riskLevel === RiskLevel.DoNotClean || item.riskLevel === RiskLevel.Protected) {
    return { allowed: false, message: "该条目命中高风险或保护规则，已阻止删除。" };
  }

  if (isProtectedPath(item.path)) {
    return { allowed: false, message: "该路径属于受保护系统目录，已阻止删除。" };
  }

  return { allowed: true, message: "允许删除" };
}
