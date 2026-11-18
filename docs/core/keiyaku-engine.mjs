const RULES = [
  {
    ruleId: "SHITAUKE-60D",
    severity: "high",
    severityLabel: "高",
    weight: 35,
    law: "下請法 第2条の2・第4条（60日支払サイト規制）",
    title: "60日超の支払サイトまたは検収起算の先送り条項",
    patterns: [
      /(?:納品|検収|引渡|請求書受領|業務完了)[^。\n]{0,24}(?:61|70|75|80|90|100|120|150|180)\s*日(?:以内|後)/g,
      /翌々月末日?(?:払い|支払い|振込|まで)/g,
      /検収(?:を)?完了(?:した|された)(?:日|後)(?:に|をもって)限り[^。\n]{0,30}(?:支払|請求)/g,
    ],
    explanation:
      "下請法・取適法対象取引では成果物受領日から起算して60日以内・できる限り短い期間内の支払期日設定が義務付けられており、検収完了を理由に起算日を無期限に先送りする条項は違反リスクがあります。",
    counterClause:
      "委託者は、受託者からの納入物の受領後10営業日以内に検収を実施し（期間内に書面による異議がない場合は検収合格とみなす）、納入物受領日から起算して60日以内かつ翌月末日までに報酬を支払う。",
  },
  {
    ruleId: "LIABILITY-UNCAPPED",
    severity: "high",
    severityLabel: "高",
    weight: 30,
    law: "民法・商取引リスク配分（損害賠償責任上限）",
    title: "無制限の損害賠償責任（責任上限の欠如・全損害負担）",
    patterns: [
      /(?:通常損害|特別損害|逸失利益|弁護士費用)[^。\n]{0,20}(?:含む|問わず)一切の損害を賠償/g,
      /(?:上限|制限)(?:なく|を設けることなく)[^。\n]{0,20}損害(?:を)?賠償/g,
      /発生した一切の損害(?:について)?(?:直ちに)?賠償(?:する義務を負う|しなければならない)/g,
    ],
    checkMissingCap: true,
    explanation:
      "損害賠償額に委託料連動の上限がなく特別損害・逸失利益まで無制限に負う条項は、1案件の委託料を大幅に超える破産的リスクを受託者に集中させます。",
    counterClause:
      "受託者の損害賠償責任は、故意または重過失による場合を除き、現実に発生した通常かつ直接の損害に限られ、その累積総額は本契約に基づき過去12ヶ月間に受領した委託料総額を上限とする。",
  },
  {
    ruleId: "IP-27-28-GRAB",
    severity: "medium",
    severityLabel: "中〜高",
    weight: 22,
    law: "著作権法第27条・第28条（翻案権等・バックグラウンドIP留保）",
    title: "27条・28条翻案権譲渡と著作者人格権不行使（既存資産の留保なし）",
    patterns: [
      /著作権（(?:著作権法)?第27条(?:及び|および|・)第28条に規定する権利を含む[^）]*）[^。\n]{0,25}譲渡/g,
      /第27条(?:及び|および|・)第28条[^。\n]{0,30}(?:すべて|一切)[^。\n]{0,20}(?:委託者|甲)(?:に|へ)移転/g,
    ],
    requireBackgroundCarveout: true,
    explanation:
      "著作権法第27条・第28条の譲渡に加えて著作者人格権不行使を一括規定する場合、受託者が従前より保有する汎用ライブラリやテンプレートまで委託者帰属と解釈されるおそれがあります。",
    counterClause:
      "本成果物の著作権（法第27条・第28条を含む）は委託料完済をもって委託者に移転する。ただし、受託者が本契約前から保有していたプログラム・ノウハウ（汎用モジュールを含む）の権利は受託者に留保され、委託者には本成果物利用に必要な範囲で非独占的利用許諾を付与する。",
  },
  {
    ruleId: "NONCOMPETE-OVERBROAD",
    severity: "medium",
    severityLabel: "中",
    weight: 16,
    law: "独占禁止法（優越的地位の濫用・フリーランス取引適正化指針）",
    title: "契約終了後2年以上または全業種一律の過度な競業避止義務",
    patterns: [
      /(?:契約終了後|終了の日から)\s*(?:[2-9]|[1-9][0-9])年間[^。\n]{0,35}(?:同種|類似|競合)/g,
      /期間中および終了後[^。\n]{0,30}(?:一切の|いかなる)競合他社[^。\n]{0,25}(?:業務|取引)を禁止/g,
    ],
    explanation:
      "業務委託契約の終了後2年以上にわたる広範な競業禁止は、受託者の営業・職業選択の自由を不当に拘束し公序良俗や独禁法上の問題を招きます。",
    counterClause:
      "受託者は本業務遂行に当たり委託者の秘密情報を競合案件へ流用しないものとし、秘密保持義務以外の契約終了後の一般的競業避止義務は負わない（または競業制限を設ける場合は終了後6ヶ月以内かつ直接担当領域に限定する）。",
  },
  {
    ruleId: "AUTORENEW-LOCKIN",
    severity: "low",
    severityLabel: "低〜中",
    weight: 12,
    law: "継続的役務契約実務（自動更新・解約予告期限）",
    title: "長期（3〜6ヶ月前）解約予告付きの自動更新ロックイン条項",
    patterns: [
      /(?:期間満了の|満了日の)\s*(?:[3-9]|1[0-2])[ヶかカ]?月前までに[^。\n]{0,35}自動(?:的に)?更新/g,
      /解約(?:を希望する場合|の申出)は\s*(?:[3-9]|1[0-2])[ヶかカ]?月前まで/g,
    ],
    explanation:
      "3ヶ月以上前の書面通知がない限り1年単位で自動更新される条項は、不要になったツール・保守契約の解約機会を失わせます。",
    counterClause:
      "本契約の有効期間満了日の1ヶ月前までにいずれの当事者からも更新しない旨の書面（電子メールを含む）による通知がない限り、同一条件にて1ヶ月単位（または協議により定める期間）で更新されるものとする。",
  },
];

const FREELANCE_CONTEXT_RE = /(?:業務委託|委託業務|フリーランス|個人事業主|受託者|乙は|請負)/;
const FREELANCE_SCOPE_RE = /(?:業務内容|委託業務の内容|業務の範囲|成果物の仕様)/;
const FREELANCE_FEE_RE = /(?:委託料|報酬|業務委託費|対価|月額[^\n]{0,12}円|金[\d,]+円)/;
const FREELANCE_PAYDATE_RE = /(?:支払期日|末日締め?[^\n]{0,16}払|日以内[^\n]{0,12}振込|\d{4}年\d{1,2}月\d{1,2}日までに支払)/;

function parseJapaneseMoneyValue(text) {
  const clean = String(text || "").replace(/[，,]/g, "").replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
  const manMatch = clean.match(/(?:契約金額|委託料|総額|代金|金)\s*([0-9]+(?:\.[0-9]+)?)\s*万円/);
  if (manMatch) {
    return Math.round(Number.parseFloat(manMatch[1]) * 10000);
  }
  const yenMatch = clean.match(/(?:契約金額|委託料|総額|代金|金)\s*([0-9]{4,12})\s*円/);
  if (yenMatch) {
    return Number.parseInt(yenMatch[1], 10);
  }
  const bareManMatch = clean.match(/([0-9]+(?:\.[0-9]+)?)\s*万円/);
  if (bareManMatch) {
    return Math.round(Number.parseFloat(bareManMatch[1]) * 10000);
  }
  return null;
}

export function estimateStampTax({
  text = "",
  amountYen = null,
  isElectronic = false,
  docType = "auto",
} = {}) {
  const rawText = String(text || "");
  const detectedAmount =
    typeof amountYen === "number" && Number.isFinite(amountYen) && amountYen >= 0
      ? Math.round(amountYen)
      : parseJapaneseMoneyValue(rawText);

  let resolvedDocType = docType;
  if (docType === "auto") {
    if (/(?:基本契約|継続的取引|個別契約において別途|取引基本)/.test(rawText) && detectedAmount === null) {
      resolvedDocType = "type7";
    } else if (/(?:請負|開発委託|製作|システム構築|完成責任)/.test(rawText)) {
      resolvedDocType = "type2";
    } else if (/(?:準委任|アドバイザリー|コンサルティング|善管注意義務)/.test(rawText)) {
      resolvedDocType = "non_taxable_mandate";
    } else {
      resolvedDocType = detectedAmount === null ? "type7" : "type2";
    }
  }

  let paperTaxYen = 0;
  let bracketLabel = "判定対象外 / 非課税文書";

  if (resolvedDocType === "non_taxable_mandate") {
    paperTaxYen = 0;
    bracketLabel = "準委任契約のみ（原則不課税 ※請負・第7号要素を含まない場合）";
  } else if (resolvedDocType === "type7") {
    paperTaxYen = 4000;
    bracketLabel = "第7号文書（継続的取引の基本となる契約書：一律 4,000円）";
  } else {
    const amt = detectedAmount ?? 0;
    if (amt < 10000) {
      paperTaxYen = 0;
      bracketLabel = "1万円未満（非課税）";
    } else if (amt <= 100000) {
      paperTaxYen = 200;
      bracketLabel = "1万円以上 10万円以下（200円※軽減措置前本則）";
    } else if (amt <= 1000000) {
      paperTaxYen = 200;
      bracketLabel = "1万円超 100万円以下（第2号文書 200円）";
    } else if (amt <= 2000000) {
      paperTaxYen = 400;
      bracketLabel = "100万円超 200万円以下（第2号文書 400円）";
    } else if (amt <= 3000000) {
      paperTaxYen = 1000;
      bracketLabel = "200万円超 300万円以下（第2号文書 1,000円）";
    } else if (amt <= 5000000) {
      paperTaxYen = 2000;
      bracketLabel = "300万円超 500万円以下（第2号文書 2,000円）";
    } else if (amt <= 10000000) {
      paperTaxYen = 10000;
      bracketLabel = "500万円超 1,000万円以下（第2号文書 10,000円）";
    } else if (amt <= 50000000) {
      paperTaxYen = 20000;
      bracketLabel = "1,000万円超 5,000万円以下（第2号文書 20,000円）";
    } else if (amt <= 100000000) {
      paperTaxYen = 60000;
      bracketLabel = "5,000万円超 1億円以下（第2号文書 60,000円）";
    } else {
      paperTaxYen = 100000;
      bracketLabel = "1億円超 5億円以下相当（第2号文書 100,000円〜）";
    }
  }

  return {
    detectedDocType: resolvedDocType,
    detectedAmountYen: detectedAmount,
    paperTaxYen,
    electronicTaxYen: 0,
    selectedTaxYen: isElectronic ? 0 : paperTaxYen,
    savingsYen: paperTaxYen,
    bracketLabel,
    isElectronic: Boolean(isElectronic),
  };
}

export function auditContractText(text, options = {}) {
  const source = String(text || "");
  const normalized = source.replace(/\r\n/g, "\n");
  const findings = [];

  for (const rule of RULES) {
    if (rule.requireBackgroundCarveout && /(?:従前より保有|本契約締結前|既存の著作権|汎用モジュール)/.test(normalized)) {
      continue;
    }

    let matchedThisRule = false;
    for (const pattern of rule.patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(normalized)) !== null) {
        matchedThisRule = true;
        findings.push({
          ruleId: rule.ruleId,
          severity: rule.severity,
          severityLabel: rule.severityLabel,
          weight: rule.weight,
          law: rule.law,
          title: rule.title,
          matched: match[0],
          start: match.index,
          end: match.index + match[0].length,
          explanation: rule.explanation,
          counterClause: rule.counterClause,
        });
      }
    }

    if (rule.checkMissingCap && !matchedThisRule && /損害賠償/.test(normalized)) {
      const hasExplicitCap = /(?:上限|委託料総額|過去\d+ヶ月|累計額を超えない|直接かつ通常の損害に限)/.test(
        normalized,
      );
      if (!hasExplicitCap) {
        const idx = normalized.indexOf("損害賠償");
        findings.push({
          ruleId: rule.ruleId,
          severity: rule.severity,
          severityLabel: rule.severityLabel,
          weight: rule.weight,
          law: rule.law,
          title: "損害賠償条項における賠償上限（Cap）の明記不足",
          matched: normalized.slice(idx, Math.min(normalized.length, idx + 28)),
          start: idx,
          end: idx + 4,
          explanation: rule.explanation,
          counterClause: rule.counterClause,
        });
      }
    }
  }

  if (FREELANCE_CONTEXT_RE.test(normalized)) {
    const missing = [];
    if (!FREELANCE_SCOPE_RE.test(normalized)) missing.push("委託業務の内容");
    if (!FREELANCE_FEE_RE.test(normalized)) missing.push("報酬額・算定方法");
    if (!FREELANCE_PAYDATE_RE.test(normalized)) missing.push("明確な支払期日");

    if (missing.length > 0) {
      findings.push({
        ruleId: "FREELANCE-3PILLARS",
        severity: "medium",
        severityLabel: "中〜高",
        weight: 20,
        law: "フリーランス保護新法 第3条・第4条（取引条件明示・60日支払）",
        title: `法定明示事項（3条書面）の不足疑い：${missing.join("・")}`,
        matched: missing.join(" / "),
        start: 0,
        end: Math.min(normalized.length, 24),
        explanation:
          "業務委託契約の締結時には、業務内容・報酬額・支払期日（受領日から60日以内）等を直ちに書面または電磁的方法で明示する義務があります。",
        counterClause:
          "第○条（業務内容・報酬および支払期日）委託者は受託者に対し、別紙仕様書記載の業務を委託し、対価として月額金○○円（消費税別）を、成果物受領日から起算して60日以内である翌月末日限り受託者指定口座へ振込により支払う。",
      });
    }
  }

  findings.sort((a, b) => a.start - b.start);
  const rawScore = findings.reduce((acc, item) => acc + item.weight, 0);
  const riskScore = Math.min(100, rawScore);
  const stampTax = estimateStampTax({
    text: normalized,
    amountYen: options.amountYen ?? null,
    isElectronic: Boolean(options.isElectronic),
    docType: options.docType ?? "auto",
  });

  return {
    riskScore,
    riskLevel: riskScore >= 60 ? "要修正（高リスク）" : riskScore >= 25 ? "要確認（中リスク）" : "概ね均衡（低リスク）",
    findingsCount: findings.length,
    findings,
    stampTax,
  };
}
