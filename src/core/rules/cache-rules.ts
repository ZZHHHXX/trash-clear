import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleHandler } from "./types.js";

const CACHE_PATH_KEYWORDS = [
  "\\cache\\",
  "\\cache_data\\",
  "\\inetcache\\",
  "\\explorer\\",
  "\\thumbnails\\",
  "\\code cache\\",
  "\\gpucache\\"
];

export const applyCacheRules: RuleHandler = ({ metadata }) => {
  const normalizedPath = metadata.path.toLowerCase().replace(/\//g, "\\");

  if (!CACHE_PATH_KEYWORDS.some((keyword) => normalizedPath.includes(keyword))) {
    return null;
  }

  return {
    matched: true,
    purpose: "缓存文件",
    reason: "命中缓存目录规则，通常会在应用后续运行时重新生成。",
    riskLevel: RiskLevel.SafeToClean,
    allowDelete: true,
    score: 95
  };
};
