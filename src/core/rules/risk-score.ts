import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { RuleMatch } from "./types.js";

export function chooseBestRule(matches: RuleMatch[]) {
  if (matches.length === 0) {
    return null;
  }

  return [...matches].sort((left, right) => right.score - left.score)[0];
}

export function createFallbackRule() {
  return {
    matched: true,
    purpose: "待进一步确认",
    reason: "当前未命中明确的清理规则，建议人工确认后再处理。",
    riskLevel: RiskLevel.DoNotClean,
    allowDelete: false,
    protected: false,
    score: 10
  } satisfies RuleMatch;
}
