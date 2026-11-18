import { auditContractText } from "./core/keiyaku-engine.mjs";

const RISKY_SAMPLE = `業務委託請負契約書（案）
第1条（委託業務・金額）甲は乙に対しWebシステム開発を請負にて委託し、請負金額は総額3,500,000円（消費税別）とする。
第2条（支払期日）甲は乙からの検収完了後に限り、翌々月末日払い（納品後90日以内）にて支払う。
第3条（権利帰属）成果物の著作権（著作権法第27条及び第28条に規定する権利を含む）は甲に譲渡され、乙は著作者人格権を行使しない。
第4条（損害賠償）乙は甲に発生した通常損害、特別損害、逸失利益を含む一切の損害を賠償する義務を負う。
第5条（競業避止）乙は契約終了後2年間、一切の競合他社との同種業務・取引を禁止する。
第6条（契約期間）期間満了の3ヶ月前までに書面による解約申出がない限り、本契約は1年間自動的に更新される。`;

const SAFE_SAMPLE = `業務委託契約書（修正均衡モデル）
第1条（業務内容・報酬・支払期日）甲は乙に対し別紙記載の委託業務を委託し、報酬月額500,000円（消費税別）を成果物受領日から起算して60日以内である翌月末日締め翌月末日までに支払う。
第2条（権利帰属・既存資産留保）本契約締結前から乙が従前より保有する汎用モジュールの権利は乙に留保する。
第3条（損害賠償上限）乙の損害賠償責任は通常かつ直接の損害に限られ、過去12ヶ月間の委託料総額を上限とする。`;

const contractInput = document.getElementById("contractTextInput");
const amountInput = document.getElementById("amountYenInput");
const docTypeSelect = document.getElementById("docTypeSelect");
const signingModeSelect = document.getElementById("signingModeSelect");
const summaryBox = document.getElementById("auditSummaryBox");
const findingsBody = document.getElementById("findingsTableBody");
const stampBody = document.getElementById("stampTaxTableBody");
const stampBracketEl = document.getElementById("stampBracketLabel");
const redlinePreview = document.getElementById("redlinePreview");

let latestMarkdown = "";

function formatYen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")} 円`;
}

function buildRedlineMarkdown(report) {
  const lines = [
    "# 契約書ドラフト点検・修正依頼メモ（KEIYAKUGATE生成）",
    "",
    `- 総合リスクスコア: ${report.riskScore}/100（${report.riskLevel}）`,
    `- 検知論点数: ${report.findingsCount} 件`,
    `- 印紙税区分: ${report.stampTax.bracketLabel}（紙: ${formatYen(report.stampTax.paperTaxYen)} / 電子: 0 円）`,
    "",
  ];
  if (report.findings.length === 0) {
    lines.push("主要な高リスク条項は検知されませんでした（個別事情・商流に応じた最終確認を推奨）。");
  } else {
    report.findings.forEach((f, idx) => {
      lines.push(`## ${idx + 1}. ${f.title} [${f.ruleId}]`);
      lines.push(`- 根拠: ${f.law}`);
      lines.push(`- 検知箇所: 「${f.matched}」`);
      lines.push(`- 理由: ${f.explanation}`);
      lines.push(`- 修正対案: ${f.counterClause}`);
      lines.push("");
    });
  }
  return lines.join("\n");
}

function renderAudit() {
  const rawAmt = amountInput.value.trim();
  const amountYen = rawAmt === "" ? null : Number(rawAmt);
  const report = auditContractText(contractInput.value, {
    amountYen: Number.isFinite(amountYen) ? amountYen : null,
    docType: docTypeSelect.value,
    isElectronic: signingModeSelect.value === "electronic",
  });

  summaryBox.className = `status-box ${
    report.findingsCount === 0 ? "is-ok" : report.riskScore >= 60 ? "is-err" : "is-warn"
  }`;
  summaryBox.textContent = `リスクスコア: ${report.riskScore}/100（${report.riskLevel}） ／ 検知件数: ${report.findingsCount} 件 ／ 選択方式の印紙税: ${formatYen(report.stampTax.selectedTaxYen)}`;

  findingsBody.replaceChildren();
  if (report.findings.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "下請法60日超・無制限賠償・長期競業禁止などの主要リスク条項は検知されませんでした。";
    tr.appendChild(td);
    findingsBody.appendChild(tr);
  } else {
    for (const f of report.findings) {
      const tr = document.createElement("tr");
      const sevTd = document.createElement("td");
      sevTd.className = `sev-${f.severity}`;
      sevTd.textContent = f.severityLabel;

      const lawTd = document.createElement("td");
      lawTd.textContent = `${f.title}（${f.law}）`;

      const matchTd = document.createElement("td");
      matchTd.textContent = f.matched;

      const counterTd = document.createElement("td");
      counterTd.textContent = f.counterClause;

      tr.append(sevTd, lawTd, matchTd, counterTd);
      findingsBody.appendChild(tr);
    }
  }

  stampBracketEl.textContent = report.stampTax.bracketLabel;
  stampBody.replaceChildren();
  const tr = document.createElement("tr");
  const typeLabel =
    report.stampTax.detectedDocType === "type7"
      ? "第7号文書"
      : report.stampTax.detectedDocType === "type2"
        ? "第2号文書"
        : "不課税区分";
  const amountDesc =
    report.stampTax.detectedAmountYen !== null
      ? `抽出・指定金額 ${formatYen(report.stampTax.detectedAmountYen)}`
      : "契約金額の明記なし";

  const td1 = document.createElement("td");
  td1.textContent = typeLabel;
  const td2 = document.createElement("td");
  td2.textContent = amountDesc;
  const td3 = document.createElement("td");
  td3.className = "num";
  td3.textContent = formatYen(report.stampTax.paperTaxYen);
  const td4 = document.createElement("td");
  td4.className = "num";
  td4.textContent = formatYen(report.stampTax.electronicTaxYen);
  const td5 = document.createElement("td");
  td5.className = "num";
  td5.textContent = formatYen(report.stampTax.savingsYen);
  tr.append(td1, td2, td3, td4, td5);
  stampBody.appendChild(tr);

  latestMarkdown = buildRedlineMarkdown(report);
  redlinePreview.textContent = latestMarkdown;
}

document.getElementById("loadRiskySampleBtn").addEventListener("click", () => {
  contractInput.value = RISKY_SAMPLE;
  amountInput.value = "";
  docTypeSelect.value = "auto";
  renderAudit();
});

document.getElementById("loadSafeSampleBtn").addEventListener("click", () => {
  contractInput.value = SAFE_SAMPLE;
  amountInput.value = "";
  docTypeSelect.value = "auto";
  renderAudit();
});

document.getElementById("runAuditBtn").addEventListener("click", renderAudit);
docTypeSelect.addEventListener("change", renderAudit);
signingModeSelect.addEventListener("change", renderAudit);

document.getElementById("copyRedlineBtn").addEventListener("click", async () => {
  if (!latestMarkdown) renderAudit();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(latestMarkdown);
    summaryBox.textContent = `${summaryBox.textContent} ／ 対案Markdownをクリップボードへコピーしました`;
  }
});

document.getElementById("downloadRedlineBtn").addEventListener("click", () => {
  if (!latestMarkdown) renderAudit();
  const blob = new Blob([latestMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "keiyaku-redline-notes.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

contractInput.value = RISKY_SAMPLE;
renderAudit();
