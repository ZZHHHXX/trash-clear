import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleHandler } from "./types.js";

const TEMP_EXTENSIONS = new Set([".tmp", ".temp", ".log", ".old"]);
const TEMP_PATH_KEYWORDS = ["\\temp\\", "\\tmp\\", "\\logs\\", "\\log\\"];

export const applyTempFileRules: RuleHandler = ({ metadata }) => {
  const normalizedPath = metadata.path.toLowerCase().replace(/\//g, "\\");
  const isTempExtension = TEMP_EXTENSIONS.has(metadata.extension);
  const isTempPath = TEMP_PATH_KEYWORDS.some((keyword) => normalizedPath.includes(keyword));

  if (!isTempExtension && !isTempPath) {
    return null;
  }

  return {
    matched: true,
    purpose: "临时文件",
    reason: "命中临时文件规则，通常属于低风险清理对象。",
    riskLevel: RiskLevel.SafeToClean,
    allowDelete: true,
    score: 100
  };
};
