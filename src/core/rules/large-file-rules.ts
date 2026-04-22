import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleHandler } from "./types.js";

const REVIEWABLE_EXTENSIONS = new Set([".zip", ".7z", ".rar", ".iso", ".exe", ".msi"]);
const DOWNLOAD_KEYWORDS = ["\\downloads\\", "\\download\\"];

export const applyLargeFileRules: RuleHandler = ({ metadata }) => {
  const normalizedPath = metadata.path.toLowerCase().replace(/\//g, "\\");
  const isDownloadFile = DOWNLOAD_KEYWORDS.some((keyword) => normalizedPath.includes(keyword));
  const isReviewableExtension = REVIEWABLE_EXTENSIONS.has(metadata.extension);

  if (metadata.size < 300 * 1024 * 1024) {
    return null;
  }

  if (!isDownloadFile && !isReviewableExtension) {
    return {
      matched: true,
      purpose: "大文件",
      reason: "文件体积较大，但当前无法确认其是否安全可删，建议谨慎处理。",
      riskLevel: RiskLevel.DoNotClean,
      allowDelete: false,
      score: 40
    };
  }

  return {
    matched: true,
    purpose: "大文件",
    reason: "命中大文件规则，位于下载目录或属于安装包/压缩包，建议确认后清理。",
    riskLevel: RiskLevel.ReviewBeforeClean,
    allowDelete: true,
    score: 70
  };
};
