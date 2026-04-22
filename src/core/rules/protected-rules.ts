import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleHandler } from "./types.js";

const PROTECTED_PATH_KEYWORDS = [
  "\\windows\\",
  "\\program files\\",
  "\\program files (x86)\\",
  "\\onedrive\\"
];

const PROTECTED_EXTENSIONS = new Set([".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf", ".psd"]);

export const applyProtectedRules: RuleHandler = ({ metadata }) => {
  const normalizedPath = metadata.path.toLowerCase().replace(/\//g, "\\");
  const recentlyModified = Date.now() - new Date(metadata.modifiedAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  if (PROTECTED_PATH_KEYWORDS.some((keyword) => normalizedPath.includes(keyword))) {
    return {
      matched: true,
      purpose: "受保护文件",
      reason: "命中系统或高价值路径保护规则，不进入普通清理候选集。",
      riskLevel: RiskLevel.Protected,
      allowDelete: false,
      protected: true,
      score: 1000
    };
  }

  if (recentlyModified && PROTECTED_EXTENSIONS.has(metadata.extension)) {
    return {
      matched: true,
      purpose: "受保护文档",
      reason: "近期活跃文档命中保护规则，不进入普通清理候选集。",
      riskLevel: RiskLevel.Protected,
      allowDelete: false,
      protected: true,
      score: 900
    };
  }

  return null;
};
