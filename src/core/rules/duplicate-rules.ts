import type { RuleHandler } from "./types.js";

// Phase 4 先预留重复文件规则入口，真正的指纹计算会在后续阶段接入。
export const applyDuplicateRules: RuleHandler = () => {
  return null;
};
