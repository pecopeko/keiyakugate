import test from "node:test";
import assert from "node:assert/strict";
import { auditContractText, estimateStampTax } from "../docs/core/keiyaku-engine.mjs";

test("auditContractText flags 60-day Subcontract Act breach, uncapped liability, IP grab, non-compete, and lock-in", () => {
  const sample = `業務委託請負契約書
  契約金額は総額3,500,000円とする。
  甲は乙の検収完了後に限り、翌々月末日払い（90日以内）にて支払う。
  成果物の著作権（著作権法第27条及び第28条に規定する権利を含む）は甲に譲渡され、乙は著作者人格権を行使しない。
  乙は通常損害、特別損害を含む一切の損害を賠償する義務を負う。
  乙は契約終了後2年間、一切の競合他社との同種業務を禁止する。
  期間満了の3ヶ月前までに解約申出がない限り自動的に更新される。`;

  const res = auditContractText(sample);
  const ruleIds = new Set(res.findings.map((f) => f.ruleId));
  assert.ok(ruleIds.has("SHITAUKE-60D"));
  assert.ok(ruleIds.has("LIABILITY-UNCAPPED"));
  assert.ok(ruleIds.has("IP-27-28-GRAB"));
  assert.ok(ruleIds.has("NONCOMPETE-OVERBROAD"));
  assert.ok(ruleIds.has("AUTORENEW-LOCKIN"));
  assert.equal(res.riskScore, 100);
  assert.equal(res.stampTax.paperTaxYen, 2000);
  assert.equal(res.stampTax.electronicTaxYen, 0);
});

test("auditContractText detects missing Freelance Act 3-pillar terms when payment date is omitted", () => {
  const draft = "業務委託契約書：甲は乙にデザイン業務を委託する。業務内容と委託料月額30万円は別途定める。";
  const res = auditContractText(draft);
  const ruleIds = new Set(res.findings.map((f) => f.ruleId));
  assert.ok(ruleIds.has("FREELANCE-3PILLARS"));
});

test("auditContractText passes balanced safe contract with 60-day payment and liability cap", () => {
  const safe = `業務委託契約書
  第1条（業務内容・報酬・支払期日）甲は乙に対し委託業務を委託し、報酬月額500,000円を成果物受領日から起算して60日以内である翌月末日締翌月末日払いとする。
  第2条（権利）乙が従前より保有する汎用モジュールの著作権は乙に留保する。
  第3条（損害賠償）乙の賠償責任は過去12ヶ月間の委託料総額を上限とする。`;
  const res = auditContractText(safe, { docType: "non_taxable_mandate" });
  assert.equal(res.findingsCount, 0);
  assert.equal(res.riskScore, 0);
  assert.equal(res.stampTax.paperTaxYen, 0);
});

test("estimateStampTax handles Type 7 master contract and Type 2 construction brackets accurately", () => {
  const type7 = estimateStampTax({ text: "継続的取引の基本となる業務委託基本契約書" });
  assert.equal(type7.detectedDocType, "type7");
  assert.equal(type7.paperTaxYen, 4000);
  assert.equal(type7.savingsYen, 4000);

  const type2High = estimateStampTax({ amountYen: 8000000, docType: "type2", isElectronic: true });
  assert.equal(type2High.paperTaxYen, 10000);
  assert.equal(type2High.selectedTaxYen, 0);
  assert.equal(type2High.savingsYen, 10000);
});
