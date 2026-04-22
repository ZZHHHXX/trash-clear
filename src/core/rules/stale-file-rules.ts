import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleHandler } from "./types.js";

const STALE_REVIEWABLE_EXTENSIONS = new Set([".zip", ".7z", ".rar", ".iso", ".exe", ".msi", ".bak"]);

export const applyStaleFileRules: RuleHandler = ({ metadata }) => {
  const lastAccessedAt = new Date(metadata.accessedAt).getTime();
  const staleDays = (Date.now() - lastAccessedAt) / (1000 * 60 * 60 * 24);

  if (staleDays < 180) {
    return null;
  }

  if (STALE_REVIEWABLE_EXTENSIONS.has(metadata.extension)) {
    return {
      matched: true,
      purpose: "长期未访问文件",
      reason: "命中长期未访问规则，且文件属于安装包、压缩包或备份类型，建议确认后清理。",
      riskLevel: RiskLevel.ReviewBeforeClean,
      allowDelete: true,
      score: 65
    };
  }

  return {
    matched: true,
    purpose: "长期未访问文件",
    reason: "命中长期未访问规则，但当前文件类型可能仍有业务价值，不建议直接清理。",
    riskLevel: RiskLevel.DoNotClean,
    allowDelete: false,
    score: 35
  };
};
