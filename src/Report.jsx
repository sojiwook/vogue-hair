import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 소감(SOGAM) 디자인 토큰 ───────────────────────────────────────────────────
// 방향: 미니멀 웰니스. 브랜드 오렌지는 '손님이 읽어야 할 것'(점수·변화·행동)에만 쓰고
// 나머지는 무채색으로 비운다. 색을 아껴야 정작 중요한 숫자가 눈에 들어온다.
const C = {
  bg: "#faf9f7",        // 페이지 바탕 — 흰색보다 아주 살짝 눌러 카드가 떠 보이게
  card: "#ffffff",
  border: "#ece9e4",    // 헤어라인. 굵은 테두리 대신 얇은 선으로만 구분
  track: "#f1eeea",     // 게이지·링의 빈 부분

  brand: "#D9602B",     // 소감 오렌지 (CLAUDE.md 지정 브랜드 컬러)
  brandSoft: "#fdf2ec", // 오렌지 배경 (강조 블록)
  brandLine: "#f2cdb8", // 오렌지 테두리

  text: "#17130f",
  sub: "#5f584f",
  muted: "#9c948a",
  red: "#c4483c",
  green: "#2f7d5a",
  blue: "#3a6fa8",
};

// ── Utility helpers ──────────────────────────────────────────────────────────

function getAreaKey(url) {
  if (!url) return null;
  const filename = (url.split('/').pop() || '').split('?')[0];
  return ['top', 'left', 'right', 'back', 'full'].find(k => filename.startsWith(k + '_')) ?? null;
}

function splitAnalysisText(text) {
  if (!text) return { main: null, products: null };
  const idx = text.search(/##\s*🛁/);
  if (idx === -1) return { main: text, products: null };
  return {
    main: text.slice(0, idx).trimEnd() || null,
    products: text.slice(idx).trim() || null,
  };
}

function parseScoreDetail(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

// 섹션 제목 — 이모지를 늘어놓는 대신 얇은 브랜드 선 하나로 위계를 만든다.
// 이모지가 많으면 눈이 분산돼 정작 읽어야 할 숫자가 묻힌다.
function SectionTitle({ children, mb = 16, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: mb }}>
      <span style={{ width: 14, height: 2, background: C.brand, borderRadius: 2, flexShrink: 0 }} />
      <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: color || C.text }}>{children}</h3>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label = "웰니스 점수" }) {
  // 점수 색은 브랜드 오렌지가 아니라 상태색을 쓴다.
  // 낮은 점수를 브랜드색으로 칠하면 '좋다'는 신호로 잘못 읽힌다.
  const color = score >= 70 ? C.green : score >= 50 ? "#c08a1c" : C.red;
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={C.track} strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 44, fontWeight: 800, color, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{score}</p>
        <p style={{ fontSize: 10.5, color: C.muted, margin: 0, marginTop: 7, letterSpacing: "0.12em" }}>{label}</p>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</span>
      </div>
      <div style={{ height: 5, background: C.track, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── 1. 두피 점수 헤드라인 ───────────────────────────────────────────────────

function DualScoreCard({ visit, prevVisit }) {
  const scalpScore = visit.scalp_score != null ? Number(visit.scalp_score) : null;
  const wellnessScore = visit.score;
  const prevScalp = prevVisit?.scalp_score != null ? Number(prevVisit.scalp_score) : null;
  const diff = (scalpScore != null && prevScalp != null) ? scalpScore - prevScalp : null;
  const diffColor = diff == null ? C.muted : diff > 0 ? C.green : diff < 0 ? C.red : C.muted;

  const mainScore = scalpScore ?? wellnessScore;
  const mainLabel = scalpScore != null ? "두피 점수" : "웰니스 점수";
  const statusMsg = mainScore >= 70
    ? "두피 상태가 양호해요 👍"
    : mainScore >= 50 ? "조금 더 관리가 필요해요 💆"
    : "집중 케어가 필요해요 ⚠️";

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
      <ScoreRing score={mainScore} label={mainLabel} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {diff != null && (
          <span style={{ fontSize: 13, fontWeight: 700, color: diffColor }}>
            {diff > 0 ? `▲${diff}` : diff < 0 ? `▼${Math.abs(diff)}` : "─"} 지난 방문 대비
          </span>
        )}
        {scalpScore != null && (
          <span style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 99, padding: "3px 10px" }}>
            웰니스 {wellnessScore}점
          </span>
        )}
      </div>
      <p style={{ marginTop: 12, fontSize: 14, color: C.sub }}>{statusMsg}</p>
    </div>
  );
}

// ── 오늘의 두피 진단 ──────────────────────────────────────────────────────────

function DiagnosisCard({ diagnosis }) {
  if (!diagnosis) return null;
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={12}>오늘의 두피 진단</SectionTitle>
      {diagnosis.type_label && (
        <div style={{ background: C.brandSoft, borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontSize: 14, fontWeight: 800, color: C.brand }}>
          {diagnosis.type_label}
        </div>
      )}
      {diagnosis.pattern && (
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 10 }}>{diagnosis.pattern}</p>
      )}
      {diagnosis.priority && (
        <div style={{ background: "#fff0f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.red, fontWeight: 700, lineHeight: 1.6 }}>
          ⚡ {diagnosis.priority}
        </div>
      )}
    </div>
  );
}

// ── 2. 내 두피 지도 ─────────────────────────────────────────────────────────

function ScalpDetailMap({ visit, prevVisit }) {
  const detail = parseScoreDetail(visit.score_detail);
  const prevDetail = parseScoreDetail(prevVisit?.score_detail);

  const ITEMS = [
    { key: '수분',    label: '두피 수분',  color: C.blue },
    { key: '모발밀도', label: '모발 밀도',  color: C.green },
    { key: '모공',    label: '모공 상태',  color: "#8B5CF6" },
    { key: '유분',    label: '유분 균형',  color: C.brand },
    { key: '민감도',  label: '민감도',     color: C.red },
  ];

  if (!detail) {
    return (
      <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <SectionTitle mb={20}>두피 지표</SectionTitle>
        <MetricBar label="두피 수분" value={visit.moisture} color={C.blue} />
        <MetricBar label="모발 탄력" value={visit.elasticity} color={C.green} />
        <MetricBar label="수면 품질" value={visit.sleep}     color={C.brand} />
        <MetricBar label="스트레스"  value={visit.stress}    color={C.red}  />
      </div>
    );
  }

  const available = ITEMS.filter(it => typeof detail[it.key] === 'number');
  if (available.length === 0) return null;

  // 5개를 나란히 늘어놓으면 손님은 "그래서 뭘 하라고?"가 된다.
  // 낮은 것만 따로 묶어주면 읽을 게 2개로 줄고, 그게 곧 할 일이 된다.
  //
  // 절대 기준선(예: 60점 미만)은 쓰지 않는다. 실제 데이터에서 지표 대부분이
  // 60점 아래로 나와, 기준선을 쓰면 5개가 전부 '신경 쓸 것'에 몰린다.
  // 손님이 온통 빨간불만 보는 리포트는 다시 열어보지 않는다.
  // 그래서 '이 손님 안에서 가장 낮은 것'을 상대적으로 집어준다.
  const byScore = [...available].sort((a, b) => detail[a.key] - detail[b.key]);
  const focusCount = available.length <= 2 ? 1 : 2;
  const focus = byScore.slice(0, focusCount);
  const keep = byScore.slice(focusCount).reverse();

  // 나머지가 실제로 양호할 때만 "잘 유지되고 있어요"라고 말한다.
  // 43점을 두고 잘 유지된다고 하면 리포트 전체의 신뢰가 깨진다.
  const keepHealthy = keep.length > 0 && keep.every(it => detail[it.key] >= 60);

  const delta = key => (typeof prevDetail?.[key] === 'number' ? detail[key] - prevDetail[key] : null);

  const Row = ({ item, strong }) => {
    const v = detail[item.key];
    const d = delta(item.key);
    return (
      <div style={{ marginBottom: strong ? 14 : 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 13.5, color: strong ? C.text : C.sub, fontWeight: strong ? 700 : 400 }}>{item.label}</span>
          <span>
            <span style={{ fontSize: strong ? 17 : 15, fontWeight: 800, color: item.color, letterSpacing: "-0.02em" }}>{v}</span>
            {d !== null && (
              <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: d > 0 ? C.green : d < 0 ? C.red : C.muted }}>
                {d > 0 ? `▲${d}` : d < 0 ? `▼${Math.abs(d)}` : "─"}
              </span>
            )}
          </span>
        </div>
        <div style={{ height: strong ? 6 : 5, background: C.track, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${v}%`, background: item.color, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={4}>두피 지표</SectionTitle>
      <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>
        {prevDetail ? "화살표는 지난 방문과 비교한 변화예요" : "다음 방문부터 지난번과 비교해서 보여드려요"}
      </p>

      <div style={{ background: C.brandSoft, border: `1px solid ${C.brandLine}`, borderRadius: 12, padding: "16px 16px 4px", marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: C.brand, marginBottom: 14, letterSpacing: "-0.01em" }}>
          이번에 신경 쓰면 좋아요
        </p>
        {focus.map(it => <Row key={it.key} item={it} strong />)}
      </div>

      {keep.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.sub, marginBottom: 14, letterSpacing: "-0.01em" }}>
            {keepHealthy ? "잘 유지되고 있어요" : "함께 지켜보는 항목"}
          </p>
          {keep.map(it => <Row key={it.key} item={it} />)}
        </div>
      )}
    </div>
  );
}

// ── 부위별 두피 지도 ─────────────────────────────────────────────────────────
// 점수를 글로 나열하면 손님이 안 읽는다. 머리를 위에서 내려다본 그림에 점수를 얹으면
// "내 정수리가 낮구나"가 한눈에 들어온다.

const AREA_MAP_POS = {
  '정수리':     { cx: 100, cy: 76,  short: '정수리' },
  '측두부(좌)': { cx: 46,  cy: 122, short: '왼쪽' },
  '측두부(우)': { cx: 154, cy: 122, short: '오른쪽' },
  '후두부':     { cx: 100, cy: 170, short: '뒤쪽' },
};

function scoreTone(s) {
  if (typeof s !== 'number') return { c: C.muted, bg: C.bg, line: C.border };
  if (s >= 70) return { c: C.green, bg: "#eef6f1", line: "#bfdccd" };
  if (s >= 50) return { c: "#b07a12", bg: "#fbf4e6", line: "#e6d2a6" };
  return { c: C.red, bg: "#fbeeed", line: "#e8bfbb" };
}

function ScalpAreaMap({ scalpParsed }) {
  const raw = Array.isArray(scalpParsed?.perAreaScores) ? scalpParsed.perAreaScores : [];
  const byArea = {};
  raw.forEach(a => { if (a?.label && typeof a.scalp_score === 'number') byArea[a.label] = a.scalp_score; });

  // 이전 방식으로 분석된 예전 방문에는 부위별 점수가 없다. 그때는 카드를 아예 띄우지 않는다.
  const shown = Object.keys(AREA_MAP_POS).filter(k => typeof byArea[k] === 'number');
  if (shown.length === 0) return null;

  const full = typeof byArea['전체'] === 'number' ? byArea['전체'] : null;

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={4}>부위별 두피 점수</SectionTitle>
      <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 10 }}>머리를 위에서 내려다본 그림이에요</p>

      <svg viewBox="0 0 200 216" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
        <text x="100" y="12" textAnchor="middle" fontSize="9" fill={C.muted}>앞</text>
        <path d="M93 30 Q100 17 107 30 Z" fill="#e8e4de" />
        <ellipse cx="100" cy="118" rx="74" ry="90" fill="#fdfcfb" stroke={C.border} strokeWidth="1.5" />

        {Object.entries(AREA_MAP_POS).map(([label, pos]) => {
          const s = byArea[label];
          const t = scoreTone(s);
          const has = typeof s === 'number';
          return (
            <g key={label}>
              <circle cx={pos.cx} cy={pos.cy} r="21" fill={t.bg} stroke={t.line}
                strokeWidth="1.5" strokeDasharray={has ? undefined : "3 3"} />
              <text x={pos.cx} y={pos.cy} textAnchor="middle" dominantBaseline="central"
                fontSize="15" fontWeight="800" fill={t.c}>{has ? s : "—"}</text>
              <text x={pos.cx} y={pos.cy + 34} textAnchor="middle" fontSize="9.5" fill={C.muted}>{pos.short}</text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
        {[{ l: "양호", c: C.green }, { l: "보통", c: "#b07a12" }, { l: "주의", c: C.red }].map(x => (
          <span key={x.l} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.muted }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: x.c }} />{x.l}
          </span>
        ))}
      </div>

      {full !== null && (
        <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 12 }}>
          전체 촬영 <span style={{ fontWeight: 800, color: scoreTone(full).c }}>{full}점</span>
        </p>
      )}

      {shown.length < 4 && (
        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          점선으로 표시된 곳은 이번에 촬영하지 않은 부위예요
        </p>
      )}
    </div>
  );
}

// ── 3. 변화 추적 ─────────────────────────────────────────────────────────────

function CompareSection({ current, prev, aiComparable = true }) {
  // scalp_score / moisture / elasticity 는 AI 채점 결과라 기준 버전이 다르면 비교할 수 없다.
  // 반면 웰니스 점수 / 수면 / 스트레스는 문진 기반이라 채점 기준과 무관하게 비교된다.
  const hasScalp = aiComparable && current.scalp_score != null && prev?.scalp_score != null;

  const metrics = [
    ...(hasScalp ? [{ key: "scalp_score", label: "두피",    higherIsBetter: true }] : []),
    { key: "score",      label: "웰니스",   higherIsBetter: true  },
    ...(aiComparable ? [
      { key: "moisture",   label: "수분도",   higherIsBetter: true  },
      { key: "elasticity", label: "탄력도",   higherIsBetter: true  },
    ] : []),
    { key: "sleep",      label: "수면",     higherIsBetter: true  },
    { key: "stress",     label: "스트레스", higherIsBetter: false },
  ];

  if (!prev) {
    return (
      <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📈 방문 추이</p>
        <p style={{ fontSize: 13, color: C.muted }}>첫 방문 기록입니다.<br />다음 방문부터 변화를 확인할 수 있어요</p>
      </div>
    );
  }

  const scoreDiff = current.score - prev.score;
  const scalpDiff = hasScalp ? Number(current.scalp_score) - Number(prev.scalp_score) : null;

  let verdictText, verdictColor;
  if (hasScalp && scalpDiff < -5 && scoreDiff >= 0) {
    verdictText = "두피 하락 중 — 집중 케어 시점 ⚠️";
    verdictColor = C.red;
  } else if (scoreDiff === 0 && (scalpDiff == null || scalpDiff === 0)) {
    verdictText = "변화 없음";
    verdictColor = C.muted;
  } else {
    const improving = (scalpDiff != null ? scalpDiff : 0) + scoreDiff > 0;
    verdictText = improving ? "전반적으로 개선되고 있어요 👍" : "관리가 필요한 시점이에요 ⚠️";
    verdictColor = improving ? C.green : C.red;
  }

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle mb={0}>지난 방문 대비 변화</SectionTitle>
        <span style={{ fontSize: 12, color: C.muted }}>기준: {prev.date}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length},1fr)`, gap: 8, marginBottom: 16 }}>
        {metrics.map(m => {
          const raw = current[m.key];
          const rawPrev = prev[m.key];
          if (raw == null || rawPrev == null) return null;
          const diff = Number(raw) - Number(rawPrev);
          const improved = m.higherIsBetter ? diff > 0 : diff < 0;
          const color = diff === 0 ? C.muted : improved ? C.green : C.red;
          const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "─";
          return (
            <div key={m.key} style={{ textAlign: "center", background: C.bg, borderRadius: 10, padding: "12px 6px" }}>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color }}>{arrow}{Math.abs(diff)}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{rawPrev} → {raw}</p>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 13, textAlign: "center", fontWeight: 700, color: verdictColor }}>
        {verdictText}
      </p>
    </div>
  );
}

// ── 3.5 나의 변화 이야기 (행동 → 몸의 변화 되먹임 고리) ──────────────────────

const SD_LABELS = { 수분: "두피 수분", 모발밀도: "모발 밀도", 모공: "모공 상태", 유분: "유분 균형", 민감도: "민감도" };

// 지난 방문에 "가장 취약했던" 항목을 골라, 그 항목의 이번 변화를 추적한다.
// score_detail이 없으면 수분도(두 방문 모두 존재)로 대체한다.
function pickFocusMetric(visit, prevVisit) {
  const cur = parseScoreDetail(visit.score_detail);
  const prev = parseScoreDetail(prevVisit?.score_detail);
  if (cur && prev) {
    const keys = Object.keys(SD_LABELS).filter(k => typeof prev[k] === 'number' && typeof cur[k] === 'number');
    if (keys.length) {
      keys.sort((a, b) => prev[a] - prev[b]); // 지난번 가장 낮았던(취약했던) 항목
      const key = keys[0];
      return { label: SD_LABELS[key], prev: prev[key], cur: cur[key] };
    }
  }
  if (prevVisit?.moisture != null && visit.moisture != null) {
    return { label: "두피 수분", prev: Number(prevVisit.moisture), cur: Number(visit.moisture) };
  }
  return null;
}

function LoopStep({ n, tag, color, children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 99, background: color, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 3 }}>{tag}</p>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 600, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

// revisit = 최신 재방문 문진(surveys). action_taken 이 있어야 "행동" 스텝이 성립한다.
function BehaviorLoopCard({ visit, prevVisit, revisit }) {
  if (!prevVisit) return null;                 // 비교할 이전 방문이 없으면 이야기가 성립 안 함
  const action = revisit?.action_taken;
  if (!action) return null;                    // 실천 데이터가 없으면 카드 자체를 숨김 (지어내지 않음)

  const didAct = action !== "못 했어요";
  const focus = pickFocusMetric(visit, prevVisit);
  const delta = focus ? focus.cur - focus.prev : null;
  const arrow = delta == null ? "" : delta > 0 ? "▲" : delta < 0 ? "▼" : "─";

  let verdict, vColor, vBg, resultColor;
  if (!didAct) {
    verdict = "이번엔 실천이 어려우셨군요. 다음엔 딱 한 가지만 해봐요 🌱";
    vColor = C.sub; vBg = C.bg; resultColor = C.muted;
  } else if (delta != null && delta > 0) {
    verdict = "내가 한 행동이 몸의 변화로 이어졌어요 🎉";
    vColor = C.green; vBg = "#f0f8f2"; resultColor = C.green;
  } else if (delta != null && delta < 0) {
    verdict = "아직 숫자로는 안 보여도, 꾸준함이 쌓이고 있어요";
    vColor = "#8a4a1a"; vBg = "#fff8f0"; resultColor = C.red;
  } else {
    verdict = "꾸준히 관리를 이어가고 계세요 👍";
    vColor = C.brand; vBg = C.brandSoft; resultColor = C.brand;
  }

  const connector = <div style={{ height: 14, borderLeft: `2px dotted ${C.border}`, marginLeft: 12 }} />;

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={18}>나의 변화 이야기</SectionTitle>

      <LoopStep n="1" tag={`지난 방문 · ${prevVisit.date}`} color={C.muted}>
        {focus
          ? <>‘{focus.label}’이 가장 신경 쓸 부분이었어요 <span style={{ color: C.muted, fontWeight: 700 }}>({focus.prev}점)</span></>
          : "지난 방문을 기록했어요"}
      </LoopStep>
      {connector}

      <LoopStep n="2" tag="그 사이 내가 한 것" color={C.brand}>
        {didAct ? action : "이번엔 실천을 못 하셨어요"}
        {didAct && revisit?.action_effect && (
          <span style={{ fontSize: 12, color: C.brand, fontWeight: 700 }}> · 느낀 효과: {revisit.action_effect}</span>
        )}
      </LoopStep>
      {connector}

      <LoopStep n="3" tag={`이번 방문 · ${visit.date}`} color={resultColor}>
        {focus
          ? <>‘{focus.label}’ <span style={{ color: C.muted, fontWeight: 700 }}>{focus.prev} → {focus.cur}</span>{" "}
              <span style={{ color: resultColor, fontWeight: 900 }}>{arrow}{Math.abs(delta)}</span></>
          : "이번 방문을 기록했어요"}
        {revisit?.scalp_change && (
          <p style={{ fontSize: 12, color: C.sub, fontWeight: 500, marginTop: 2 }}>느낌도 “{revisit.scalp_change}”</p>
        )}
      </LoopStep>

      <div style={{ marginTop: 16, background: vBg, borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, color: vColor, textAlign: "center" }}>
        {verdict}
      </div>
    </div>
  );
}

// ── 4. 사진 비교 (부위별 쌍) ─────────────────────────────────────────────────

const AREA_ORDER = ['top', 'left', 'right', 'back', 'full'];
const AREA_LABELS_MAP = { top: '정수리', left: '측두부(좌)', right: '측두부(우)', back: '후두부', full: '전체' };

function PhotoPairSection({ currentImages, prevImages, visit, prevVisit }) {
  if (currentImages.length === 0) return null;

  const imgBase = { width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", borderRadius: 8 };
  const hasPrev = prevImages.length > 0;

  if (!hasPrev) {
    const cols = currentImages.length === 1 ? 1 : currentImages.length <= 3 ? 3 : 3;
    return (
      <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <SectionTitle mb={16}>이번 방문 두피 사진</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
          {currentImages.map((url, i) => {
            const k = getAreaKey(url);
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <img src={url} alt={k ? AREA_LABELS_MAP[k] : `사진 ${i + 1}`}
                  style={{ ...imgBase, border: `2px solid ${C.brandLine}` }} />
                <p style={{ fontSize: 10, color: C.sub, marginTop: 4, fontWeight: 600 }}>
                  {k ? AREA_LABELS_MAP[k] : `사진 ${i + 1}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const curMap = {}, prevMap = {};
  currentImages.forEach(url => { const k = getAreaKey(url); if (k && !curMap[k]) curMap[k] = url; });
  prevImages.forEach(url => { const k = getAreaKey(url); if (k && !prevMap[k]) prevMap[k] = url; });

  // 두 방문의 부위를 합집합으로 잡는다.
  // 이번에 찍은 부위만 보면(교집합/현재 기준) 지난번엔 찍었는데 이번엔 안 찍은 부위가
  // 화면에서 통째로 사라져, 고객은 지난 사진이 없어진 것처럼 느낀다.
  const orderedPairs = AREA_ORDER.filter(k => curMap[k] || prevMap[k]);
  const unkeyedCur = currentImages.filter(url => !getAreaKey(url));

  const missingSlot = (title, sub) => (
    <div style={{ aspectRatio: "1", background: C.bg, borderRadius: 8, border: `1.5px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 12 }}>
      <span style={{ fontSize: 18 }}>📷</span>
      <p style={{ fontSize: 11, color: C.text, fontWeight: 700, textAlign: "center" }}>{title}</p>
      <p style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.4 }}>{sub}</p>
    </div>
  );

  const comparable = orderedPairs.filter(k => curMap[k] && prevMap[k]).length;

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={6}>두피 사진 변화</SectionTitle>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
        기록된 {orderedPairs.length}개 부위 중 {comparable}개를 나란히 비교할 수 있어요
      </p>

      {orderedPairs.map(k => (
        <div key={k} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>{AREA_LABELS_MAP[k]}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 5, fontWeight: 600 }}>이전 ({prevVisit.date})</p>
              {prevMap[k]
                ? <img src={prevMap[k]} alt={`이전 ${AREA_LABELS_MAP[k]}`}
                    style={{ ...imgBase, border: `1px solid ${C.border}` }} />
                : missingSlot("이전 방문 미촬영", "이 부위는 이번에 처음 기록됩니다")
              }
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.brand, marginBottom: 5, fontWeight: 600 }}>현재 ({visit.date})</p>
              {curMap[k]
                ? <img src={curMap[k]} alt={`현재 ${AREA_LABELS_MAP[k]}`}
                    style={{ ...imgBase, border: `2px solid ${C.brandLine}` }} />
                : missingSlot("이번엔 미촬영", "지난 기록은 그대로 보관돼요")
              }
            </div>
          </div>
        </div>
      ))}

      {unkeyedCur.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
          {unkeyedCur.map((url, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.brand, marginBottom: 5, fontWeight: 600 }}>현재 ({visit.date})</p>
              <img src={url} alt={`현재 사진 ${i + 1}`}
                style={{ ...imgBase, border: `2px solid ${C.brandLine}` }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        {[{ label: "수분도", key: "moisture", color: C.brand }, { label: "탄력도", key: "elasticity", color: C.green }].map(m => {
          const diff = visit[m.key] - prevVisit[m.key];
          const diffColor = diff > 0 ? C.green : diff < 0 ? C.red : C.muted;
          const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "─";
          return (
            <div key={m.key} style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.sub }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>
                <span style={{ color: C.muted }}>{prevVisit[m.key]} → </span>
                <span style={{ color: m.color }}>{visit[m.key]}</span>
                <span style={{ color: diffColor, fontSize: 11, marginLeft: 4 }}>{arrow}{Math.abs(diff)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 6. 제품 추천 카드 (측정값 근거 포함) ────────────────────────────────────

function ProductCard({ text, visit }) {
  const content = text.replace(/^##\s*🛁[^\n]*\n?/, '').trim();
  const detail = parseScoreDetail(visit.score_detail);

  const basisItems = detail
    ? [
        { key: '수분', label: '두피 수분' },
        { key: '모발밀도', label: '모발 밀도' },
        { key: '유분', label: '유분' },
      ].filter(it => typeof detail[it.key] === 'number').map(it => `${it.label} ${detail[it.key]}점`)
    : (visit.moisture != null ? [`수분도 ${visit.moisture}점`, `탄력도 ${visit.elasticity}점`] : []);

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <SectionTitle mb={12}>오늘의 제품 추천</SectionTitle>
      {basisItems.length > 0 && (
        <div style={{ background: C.brandSoft, borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontSize: 12, color: C.brand, fontWeight: 700 }}>
          📊 측정 기준: {basisItems.join(' · ')}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9 }}>
        {renderMarkdown(content)}
      </div>
      <div style={{ marginTop: 14, padding: "10px 14px", background: C.bg, borderRadius: 10, fontSize: 12, color: C.muted, textAlign: "center" }}>
        📅 다음 방문에서 사용 후 변화를 함께 확인합니다
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return null;
  return String(text).split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') return <br key={i} />;
    if (/^##\s*두피\s*분석\s*[-–]/.test(trimmed)) return null;
    if (/^분석\s*부위\s*:/.test(trimmed)) return null;
    const locMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (locMatch) {
      return (
        <p key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: C.brand, marginTop: 14, marginBottom: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: C.brand, flexShrink: 0 }} />
          {locMatch[1]}
        </p>
      );
    }
    const locInlineMatch = trimmed.match(/^\[([^\]]+)\]\s+(.+)/);
    if (locInlineMatch) {
      return (
        <p key={i} style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.85, marginBottom: 5 }}>
          <span style={{ fontWeight: 800, color: C.brand }}>{locInlineMatch[1]}</span>
          {' '}{locInlineMatch[2]}
        </p>
      );
    }
    const headerMatch = trimmed.match(/^#{1,3}\s+(.*)/);
    if (headerMatch) {
      const hText = headerMatch[1].trim();
      if (!hText) return null;
      // 제목을 전부 브랜드색으로 칠하면 본문과 경쟁한다. 색 대신 크기·굵기로 위계를 준다.
      return <p key={i} style={{ fontSize: 14.5, fontWeight: 800, color: C.text, letterSpacing: "-0.01em", marginTop: i > 0 ? 18 : 0, marginBottom: 7 }}>{hText}</p>;
    }
    const parts = trimmed.split('**');
    return (
      <p key={i} style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.85, marginBottom: 3 }}>
        {parts.map((part, pi) =>
          pi % 2 === 1
            ? <strong key={pi} style={{ fontWeight: 700, color: C.brand }}>{part}</strong>
            : part
        )}
      </p>
    );
  });
}

// ── Main Report component ─────────────────────────────────────────────────────

// ── 리포트 공유 ───────────────────────────────────────────────────────────────
// 카카오 알림톡으로 리포트를 받은 고객이 가족·지인에게 그대로 전달할 수 있게 한다.
// 카카오톡 인앱 브라우저는 navigator.share 지원이 기기마다 달라서 링크 복사 폴백이 필수다.

function ShareButton({ url }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // 구형·인앱 브라우저는 clipboard API를 막아둔 경우가 있다
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 복사조차 막힌 환경 — 주소를 직접 보여주고 길게 눌러 복사하도록 안내
      setFailed(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "소감 두피 웰니스 리포트", text: "제 두피 웰니스 리포트예요 ✦", url });
        return;
      } catch (e) {
        // 사용자가 공유창을 그냥 닫은 경우는 오류가 아니다
        if (e?.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <button
        onClick={handleShare}
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1.5px solid ${C.brand}`, background: C.brandSoft, color: C.brand,
          fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {copied ? "✓ 링크가 복사되었어요" : "📤 이 리포트 공유하기"}
      </button>

      <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
        공유하면 받은 분도 이름·사진이 담긴 리포트를 볼 수 있어요
      </p>

      {failed && (
        <p style={{
          fontSize: 11, color: C.sub, marginTop: 10, padding: "10px 12px",
          background: C.bg, borderRadius: 10, wordBreak: "break-all", lineHeight: 1.6,
        }}>
          아래 주소를 길게 눌러 복사해 주세요<br />{url}
        </p>
      )}
    </div>
  );
}

export default function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [satSubmitted, setSatSubmitted] = useState(false);
  const [satSubmitting, setSatSubmitting] = useState(false);
  const [revisit, setRevisit] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const phone = params.get("phone");

    if (!token && !phone) { setError("유효하지 않은 리포트 링크입니다."); setLoading(false); return; }

    const load = async () => {
      if (token) {
        // .single()은 결과가 정확히 1행이 아니면 조회 자체를 실패로 만든다.
        // 토큰이 중복될 일은 거의 없지만, 그때 리포트가 통째로 안 열리는 건 과한 대가다.
        const { data: tokenVisits } = await supabase
          .from("visits")
          .select("*")
          .eq("report_token", token)
          .limit(1);
        const visit = tokenVisits?.[0] ?? null;

        if (!visit) { setError("유효하지 않은 리포트 링크입니다."); setLoading(false); return; }

        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", visit.customer_id)
          .single();

        if (!customer) { setError("고객 정보를 찾을 수 없습니다."); setLoading(false); return; }

        const { data: prevVisits } = await supabase
          .from("visits")
          .select("*")
          .eq("customer_id", customer.id)
          .lt("id", visit.id)
          .order("date", { ascending: false })
          .order("id", { ascending: false })
          .limit(1);

        setData({ customer, visit, prevVisit: prevVisits?.[0] || null });
        setLoading(false);
        return;
      }

      // phone fallback (하위 호환)
      // 같은 번호로 고객이 2명 이상 등록되는 일이 실제로 있다(테스트 계정 중복 등).
      // .single()을 쓰면 그 순간 조회가 실패(PGRST116)해 리포트가 아예 안 열린다.
      // 테스트 계정을 빼고 가장 최근에 등록된 고객을 고른다.
      const { data: matched } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .order("created_at", { ascending: false });

      const customer = (matched ?? []).find(c => !c.is_test) ?? matched?.[0] ?? null;

      if (!customer) { setError("고객 정보를 찾을 수 없습니다."); setLoading(false); return; }

      const { data: visits } = await supabase
        .from("visits")
        .select("*")
        .eq("customer_id", customer.id)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .limit(2);

      if (!visits || visits.length === 0) { setError("방문 기록이 없습니다."); setLoading(false); return; }

      setData({ customer, visit: visits[0], prevVisit: visits[1] || null });
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const check = async () => {
      const { data: existing } = await supabase
        .from("satisfaction")
        .select("id,q1_report_helpful,q2_home_care,q3_revisit_intention")
        .eq("visit_id", data.visit.id)
        .limit(1);
      if (existing?.[0]) {
        setQ1(existing[0].q1_report_helpful);
        setQ2(existing[0].q2_home_care);
        setQ3(existing[0].q3_revisit_intention);
        setSatSubmitted(true);
      }
    };
    check();
  }, [data]);

  // 이 방문에 연결된 문진 로드 — "나의 변화 이야기" 카드의 실천(action) 데이터
  useEffect(() => {
    if (!data?.visit?.id) return;
    const loadRevisit = async () => {
      // 1순위: visit_id로 이 방문의 문진을 정확히 매칭 (종단 정합)
      const { data: byVisit } = await supabase
        .from("surveys")
        .select("visit_type,action_taken,action_effect,scalp_change")
        .eq("visit_id", data.visit.id)
        .limit(1);
      if (byVisit?.[0]) { setRevisit(byVisit[0]); return; }

      // 폴백: visit_id 없던 구 데이터 → 전화번호 기준 최신 재방문 문진
      if (!data.customer?.phone) return;
      const { data: byPhone } = await supabase
        .from("surveys")
        .select("visit_type,action_taken,action_effect,scalp_change,created_at")
        .eq("phone", data.customer.phone)
        .eq("visit_type", "revisit")
        .order("created_at", { ascending: false })
        .limit(1);
      setRevisit(byPhone?.[0] ?? null);
    };
    loadRevisit();
  }, [data]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.muted, fontSize: 14 }}>리포트 불러오는 중...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.red, fontSize: 14 }}>⚠️ {error}</p>
    </div>
  );

  const { customer, visit, prevVisit } = data;

  // 채점 기준(analysis_version)이 다르면 점수를 나란히 두면 안 된다.
  // 다른 자로 잰 값이라, 개선/악화를 반대로 알려줄 수 있다.
  // 사진 비교는 채점과 무관하므로 그대로 유지한다.
  const versionChanged = !!prevVisit &&
    (visit.analysis_version ?? null) !== (prevVisit.analysis_version ?? null);
  const comparablePrev = versionChanged ? null : prevVisit;

  // ?phone= 링크를 그대로 공유하면 전화번호가 상대방 대화방에 남는다 → 토큰 링크만 공유한다
  const shareUrl = visit.report_token
    ? `${window.location.origin}${window.location.pathname}?token=${visit.report_token}`
    : null;

  const parseScalpReport = raw => {
    if (!raw) return null;
    try { return typeof raw === 'object' ? raw : JSON.parse(raw); }
    catch { return { aiAnalysis: String(raw) }; }
  };
  const scalpParsed = parseScalpReport(visit.scalp_report);
  console.log('[Report] scalpParsed.diagnosis:', scalpParsed?.diagnosis ?? '없음 (null)');
  const aiRaw = scalpParsed?.aiAnalysis;
  const scalpText = (aiRaw && typeof aiRaw === 'string' && aiRaw.trim())
    ? aiRaw
    : (typeof visit.scalp_report === 'string' && visit.scalp_report.trim())
      ? visit.scalp_report
      : null;

  const currentImages = Array.isArray(visit.scalp_images) ? visit.scalp_images : [];
  const prevImages = Array.isArray(prevVisit?.scalp_images) ? prevVisit.scalp_images : [];

  const { main: analysisText, products: productText } = splitAnalysisText(scalpText);

  const submitSatisfaction = async () => {
    if (!q1 || !q2 || !q3 || satSubmitted || satSubmitting) return;
    setSatSubmitting(true);
    await supabase.from("satisfaction").insert({
      visit_id: visit.id,
      q1_report_helpful: q1,
      q2_home_care: q2,
      q3_revisit_intention: q3,
    });
    setSatSubmitted(true);
    setSatSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sogam-font)", color: C.text }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* 헤더 — 브랜드 워드마크를 주인공으로. 색 면 대신 여백과 헤어라인으로 구분한다 */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "34px 20px 26px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{
            fontSize: 28, fontWeight: 800, color: C.brand, lineHeight: 1,
            letterSpacing: "0.26em", marginBottom: 14,
            // 자간이 마지막 글자 뒤에도 붙어 오른쪽이 떠 보이는 걸 상쇄
            marginRight: "-0.26em",
          }}>SOGAM</p>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>두피 웰니스 리포트</h1>
          <p style={{ fontSize: 12.5, color: C.muted, marginTop: 6 }}>{visit.date} · {customer.stylist} 스타일리스트</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* 고객 정보 — 헤더에서 이어지는 인사라 카드로 감싸지 않는다.
            담당 스타일리스트는 헤더에 이미 있어 중복을 뺐다 */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 5 }}>{customer.name}님</p>
          <p style={{ fontSize: 13, color: C.muted }}>{visit.service || "두피 케어"}</p>
        </div>

        {/* 1. 두피 점수 헤드라인 */}
        <DualScoreCard visit={visit} prevVisit={comparablePrev} />

        {/* 채점 기준이 바뀐 방문에만 뜬다. 손님이 "점수가 왜 갑자기 달라졌지?" 하지 않도록 미리 설명한다 */}
        {versionChanged && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.75 }}>
              이번 방문부터 두피 점수를 더 정밀한 기준으로 매기고 있어요.
              기준이 달라져서 지난 방문 점수와는 나란히 비교하지 않았습니다.
              사진 비교는 그대로 보실 수 있어요.
            </p>
          </div>
        )}


        {/* 🔄 나의 변화 이야기 (행동 → 몸의 변화) */}
        <BehaviorLoopCard visit={visit} prevVisit={comparablePrev} revisit={revisit} />

        {/* 🧭 오늘의 두피 진단 */}
        {scalpParsed?.diagnosis && <DiagnosisCard diagnosis={scalpParsed.diagnosis} />}

        {/* 2. 내 두피 지도 */}
        <ScalpAreaMap scalpParsed={scalpParsed} />
        <ScalpDetailMap visit={visit} prevVisit={comparablePrev} />

        {/* 3. 변화 추적 */}
        <CompareSection current={visit} prev={prevVisit} aiComparable={!versionChanged} />

        {/* 4. 사진 비교 (부위 쌍) */}
        <PhotoPairSection
          currentImages={currentImages}
          prevImages={prevImages}
          visit={visit}
          prevVisit={prevVisit}
        />

        {/* 5. AI 통합 분석 (제품 섹션 제외) */}
        {analysisText && (
          <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <SectionTitle mb={16}>AI 두피 분석</SectionTitle>
            {scalpParsed?.scalpType && scalpParsed.scalpType !== "분석 참조" && (
              <p style={{ fontSize: 13, color: C.brand, fontWeight: 700, marginBottom: 12 }}>두피 타입: {scalpParsed.scalpType}</p>
            )}
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9 }}>
              {renderMarkdown(analysisText)}
            </div>
          </div>
        )}

        {/* 6. 제품 추천 (측정값 근거 포함, 1곳에만) */}
        {productText && <ProductCard text={productText} visit={visit} />}

        {/* 메모 */}
        {visit.note && (
          <div style={{ background: C.brandSoft, borderRadius: 14, padding: 20, marginBottom: 16, border: `1px solid ${C.brandLine}` }}>
            <SectionTitle mb={8} color={C.brand}>스타일리스트 메모</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>{visit.note}</p>
          </div>
        )}

        {/* 만족도 */}
        <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <SectionTitle mb={20}>소감 남기기</SectionTitle>

          {satSubmitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💛</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.brand, marginBottom: 6 }}>감사합니다 💛</p>
              <p style={{ fontSize: 13, color: C.muted }}>소중한 의견이 더 나은 케어로 이어집니다</p>
            </div>
          ) : (
            <>
              {/* Q1 */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Q1. 오늘 리포트, 얼마나 도움이 됐나요?</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {[{ v: 1, e: "😞" }, { v: 2, e: "😐" }, { v: 3, e: "😊" }, { v: 4, e: "🤩" }].map(({ v, e }) => (
                    <button key={v} onClick={() => setQ1(v)} style={{
                      width: 60, height: 60, borderRadius: 14,
                      border: `2px solid ${q1 === v ? C.brand : C.border}`,
                      background: q1 === v ? C.brandSoft : "#fff",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 2,
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 24 }}>{e}</span>
                      <span style={{ fontSize: 10, color: q1 === v ? C.brand : C.muted, fontWeight: q1 === v ? 700 : 400 }}>{v}점</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Q2. 집에서 관리해보고 싶은 게 생겼나요?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["샴푸 바꾸기", "두피 마사지", "수면 개선", "없어요"].map(v => (
                    <button key={v} onClick={() => setQ2(v)} style={{
                      padding: "11px 8px", borderRadius: 10, fontFamily: "inherit", fontSize: 13,
                      border: `1.5px solid ${q2 === v ? C.brand : C.border}`,
                      background: q2 === v ? C.brandSoft : "#fff",
                      color: q2 === v ? C.brand : C.text,
                      fontWeight: q2 === v ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {q2 === v ? "✓ " : ""}{v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Q3. 다음번에도 리포트를 받아보실 의향이 있으신가요?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[{ v: 3, l: "네, 받아볼게요" }, { v: 2, l: "고민해볼게요" }, { v: 1, l: "아니요" }].map(({ v, l }) => (
                    <button key={v} onClick={() => setQ3(v)} style={{
                      padding: "11px 6px", borderRadius: 10, fontFamily: "inherit", fontSize: 12,
                      border: `1.5px solid ${q3 === v ? C.brand : C.border}`,
                      background: q3 === v ? C.brandSoft : "#fff",
                      color: q3 === v ? C.brand : C.text,
                      fontWeight: q3 === v ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {q3 === v ? "✓ " : ""}{l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={submitSatisfaction}
                disabled={!q1 || !q2 || !q3 || satSubmitting}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12, border: "none",
                  background: (q1 && q2 && q3 && !satSubmitting) ? C.brand : C.border,
                  color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                  cursor: (q1 && q2 && q3 && !satSubmitting) ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {satSubmitting ? "저장 중..." : "소감 남기기"}
              </button>
            </>
          )}
        </div>

        {/* 공유 */}
        {shareUrl && <ShareButton url={shareUrl} />}

        {/* 하단 */}
        <div style={{ textAlign: "center", padding: "32px 0 10px", borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
          <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.26em", color: C.brand, marginBottom: 10, marginRight: "-0.26em" }}>SOGAM</p>
          <p style={{ fontSize: 12, color: C.muted }}>다음 방문에도 건강한 두피로 만나요</p>
        </div>
      </div>
    </div>
  );
}
