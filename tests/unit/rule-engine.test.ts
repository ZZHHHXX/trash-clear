import test from "node:test";
import assert from "node:assert/strict";
import { RiskLevel } from "../../src/shared/enums/risk-level.js";
import { evaluateFile } from "../../src/core/rules/rule-engine.js";

test("should classify cache paths as safe to clean", () => {
  const result = evaluateFile({
    path: "D:\\Users\\Demo\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data\\data_1",
    name: "data_1",
    extension: "",
    size: 4096,
    modifiedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
    accessedAt: new Date("2025-01-01T00:00:00.000Z").toISOString()
  });

  assert.equal(result.selected.riskLevel, RiskLevel.SafeToClean);
  assert.equal(result.selected.allowDelete, true);
});

test("should protect recent office documents", () => {
  const result = evaluateFile({
    path: "D:\\Work\\Reports\\quarterly-report.docx",
    name: "quarterly-report.docx",
    extension: ".docx",
    size: 20480,
    modifiedAt: new Date().toISOString(),
    accessedAt: new Date().toISOString()
  });

  assert.equal(result.selected.riskLevel, RiskLevel.Protected);
  assert.equal(result.selected.allowDelete, false);
});

test("should mark large download installers for review", () => {
  const result = evaluateFile({
    path: "E:\\Downloads\\setup-package.iso",
    name: "setup-package.iso",
    extension: ".iso",
    size: 900 * 1024 * 1024,
    modifiedAt: new Date("2024-01-01T00:00:00.000Z").toISOString(),
    accessedAt: new Date("2024-01-01T00:00:00.000Z").toISOString()
  });

  assert.equal(result.selected.riskLevel, RiskLevel.ReviewBeforeClean);
});
