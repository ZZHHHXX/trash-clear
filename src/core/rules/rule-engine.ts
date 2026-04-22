import type { FileMetadata } from "../scanner/metadata-reader.js";
import { applyCacheRules } from "./cache-rules.js";
import { applyDuplicateRules } from "./duplicate-rules.js";
import { applyLargeFileRules } from "./large-file-rules.js";
import { applyProtectedRules } from "./protected-rules.js";
import { createFallbackRule, chooseBestRule } from "./risk-score.js";
import { applyStaleFileRules } from "./stale-file-rules.js";
import { applyTempFileRules } from "./temp-file-rules.js";
import type { RuleHandler, RuleMatch } from "./types.js";

const RULES: RuleHandler[] = [
  applyProtectedRules,
  applyTempFileRules,
  applyCacheRules,
  applyLargeFileRules,
  applyStaleFileRules,
  applyDuplicateRules
];

export function evaluateFile(metadata: FileMetadata) {
  const matches = RULES.map((rule) => rule({ metadata })).filter((match): match is RuleMatch => Boolean(match));
  const selected = chooseBestRule(matches) ?? createFallbackRule();

  return {
    selected,
    matches
  };
}
