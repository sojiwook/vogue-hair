import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  bg: "#f8f6f2", card: "#fff", border: "#ede8e0",
  gold: "#b8965a", goldBg: "#fdf8f0", goldLight: "#d4b07a",
  text: "#1a1a1a", sub: "#666", muted: "#999",
  red: "#d94f4f", green: "#3a8c5c", blue: "#3a6fa8",
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

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label = "웰니스 점수" }) {
  const color = score >= 70 ? C.green : score >= 50 ? "#b07800" : C.red;
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f0ece4" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 36, fontWeight: 900, color, margin: 0 }}>{score}</p>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{label}</p>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}점</span>
      </div>
      <div style={{ height: 8, background: "#f0ece4", borderRadius: 99, overflow: "hidden" }}>
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
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
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

// ── 2. 내 두피 지도 ─────────────────────────────────────────────────────────

function ScalpDetailMap({ visit }) {
  const detail = parseScoreDetail(visit.score_detail);

  const ITEMS = [
    { key: '수분',    label: '두피 수분',  color: C.blue },
    { key: '모발밀도', label: '모발 밀도',  color: C.green },
    { key: '모공',    label: '모공 상태',  color: "#8B5CF6" },
    { key: '유분',    label: '유분 균형',  color: C.gold },
    { key: '민감도',  label: '민감도',     color: C.red },
  ];

  if (!detail) {
    return (
      <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>📊 두피 지표</h3>
        <MetricBar label="두피 수분" value={visit.moisture} color={C.blue} />
        <MetricBar label="모발 탄력" value={visit.elasticity} color={C.green} />
        <MetricBar label="수면 품질" value={visit.sleep}     color={C.gold} />
        <MetricBar label="스트레스"  value={visit.stress}    color={C.red}  />
      </div>
    );
  }

  const available = ITEMS.filter(it => typeof detail[it.key] === 'number');
  if (available.length === 0) return null;

  const sorted = [...available].sort((a, b) => detail[a.key] - detail[b.key]);
  const weakest = sorted[0];

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>🗺 내 두피 지도</h3>
      {available.length >= 2 && (
        <div style={{ background: "#fff8f0", border: "1px solid #f0d5b8", borderRadius: 10, padding: "9px 14px", marginBottom: 16, fontSize: 13, fontWeight: 700, color: "#8a4a1a" }}>
          ⚑ {weakest.label}({detail[weakest.key]}점)이 가장 취약 — 집중 관리 권장
        </div>
      )}
      {available.map(item => (
        <MetricBar key={item.key} label={item.label} value={detail[item.key]} color={item.color} />
      ))}
    </div>
  );
}

// ── 3. 변화 추적 ─────────────────────────────────────────────────────────────

function CompareSection({ current, prev }) {
  const hasScalp = current.scalp_score != null && prev?.scalp_score != null;

  const metrics = [
    ...(hasScalp ? [{ key: "scalp_score", label: "두피",    higherIsBetter: true }] : []),
    { key: "score",      label: "웰니스",   higherIsBetter: true  },
    { key: "moisture",   label: "수분도",   higherIsBetter: true  },
    { key: "elasticity", label: "탄력도",   higherIsBetter: true  },
    { key: "sleep",      label: "수면",     higherIsBetter: true  },
    { key: "stress",     label: "스트레스", higherIsBetter: false },
  ];

  if (!prev) {
    return (
      <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
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
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>📈 지난 방문 대비 변화</h3>
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
      <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📸 이번 방문 두피 사진</h3>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
          {currentImages.map((url, i) => {
            const k = getAreaKey(url);
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <img src={url} alt={k ? AREA_LABELS_MAP[k] : `사진 ${i + 1}`}
                  style={{ ...imgBase, border: `2px solid ${C.goldLight}` }} />
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

  const orderedPairs = AREA_ORDER.filter(k => curMap[k]);
  const unkeyedCur = currentImages.filter(url => !getAreaKey(url));

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📸 두피 사진 변화</h3>

      {orderedPairs.map(k => (
        <div key={k} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>{AREA_LABELS_MAP[k]}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 5, fontWeight: 600 }}>이전 ({prevVisit.date})</p>
              {prevMap[k]
                ? <img src={prevMap[k]} alt={`이전 ${AREA_LABELS_MAP[k]}`}
                    style={{ ...imgBase, border: `1px solid ${C.border}` }} />
                : (
                  <div style={{ minHeight: 90, background: C.bg, borderRadius: 8, border: `1.5px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 12 }}>
                    <span style={{ fontSize: 18 }}>📷</span>
                    <p style={{ fontSize: 11, color: C.text, fontWeight: 700, textAlign: "center" }}>이전 방문 미촬영</p>
                    <p style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>이 부위는 이번에<br />처음 기록됩니다</p>
                  </div>
                )
              }
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.gold, marginBottom: 5, fontWeight: 600 }}>현재 ({visit.date})</p>
              <img src={curMap[k]} alt={`현재 ${AREA_LABELS_MAP[k]}`}
                style={{ ...imgBase, border: `2px solid ${C.goldLight}` }} />
            </div>
          </div>
        </div>
      ))}

      {unkeyedCur.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
          {unkeyedCur.map((url, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.gold, marginBottom: 5, fontWeight: 600 }}>현재 ({visit.date})</p>
              <img src={url} alt={`현재 사진 ${i + 1}`}
                style={{ ...imgBase, border: `2px solid ${C.goldLight}` }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        {[{ label: "수분도", key: "moisture", color: C.gold }, { label: "탄력도", key: "elasticity", color: C.green }].map(m => {
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
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🛁 오늘의 제품 추천</h3>
      {basisItems.length > 0 && (
        <div style={{ background: C.goldBg, borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontSize: 12, color: C.gold, fontWeight: 700 }}>
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
      return <p key={i} style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginTop: 10, marginBottom: 4 }}>📍 {locMatch[1]}</p>;
    }
    const locInlineMatch = trimmed.match(/^\[([^\]]+)\]\s+(.+)/);
    if (locInlineMatch) {
      return (
        <p key={i} style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, color: C.gold }}>📍 {locInlineMatch[1]}</span>
          {' '}{locInlineMatch[2]}
        </p>
      );
    }
    const headerMatch = trimmed.match(/^#{1,3}\s+(.*)/);
    if (headerMatch) {
      const hText = headerMatch[1].trim();
      if (!hText) return null;
      return <p key={i} style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>{hText}</p>;
    }
    const parts = trimmed.split('**');
    return (
      <p key={i} style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 2 }}>
        {parts.map((part, pi) =>
          pi % 2 === 1
            ? <strong key={pi} style={{ fontWeight: 700, color: C.gold }}>{part}</strong>
            : part
        )}
      </p>
    );
  });
}

// ── Main Report component ─────────────────────────────────────────────────────

export default function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [satSubmitted, setSatSubmitted] = useState(false);
  const [satSubmitting, setSatSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const phone = params.get("phone");

    if (!token && !phone) { setError("유효하지 않은 리포트 링크입니다."); setLoading(false); return; }

    const load = async () => {
      if (token) {
        const { data: visit } = await supabase
          .from("visits")
          .select("*")
          .eq("report_token", token)
          .single();

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
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .single();

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

  const parseScalpReport = raw => {
    if (!raw) return null;
    try { return typeof raw === 'object' ? raw : JSON.parse(raw); }
    catch { return { aiAnalysis: String(raw) }; }
  };
  const scalpParsed = parseScalpReport(visit.scalp_report);
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
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans KR', sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* 헤더 */}
      <div style={{ background: C.gold, padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>SOGAM</p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>두피 케어 리포트</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{visit.date} · {customer.stylist} 스타일리스트</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* 고객 정보 */}
        <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{customer.name}님</p>
          <p style={{ fontSize: 13, color: C.muted }}>담당: {customer.stylist} · 시술: {visit.service || "두피 케어"}</p>
        </div>

        {/* 1. 두피 점수 헤드라인 */}
        <DualScoreCard visit={visit} prevVisit={prevVisit} />

        {/* 2. 내 두피 지도 */}
        <ScalpDetailMap visit={visit} />

        {/* 3. 변화 추적 */}
        <CompareSection current={visit} prev={prevVisit} />

        {/* 4. 사진 비교 (부위 쌍) */}
        <PhotoPairSection
          currentImages={currentImages}
          prevImages={prevImages}
          visit={visit}
          prevVisit={prevVisit}
        />

        {/* 5. AI 통합 분석 (제품 섹션 제외) */}
        {analysisText && (
          <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>🔬 AI 두피 분석</h3>
            {scalpParsed?.scalpType && scalpParsed.scalpType !== "분석 참조" && (
              <p style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 12 }}>두피 타입: {scalpParsed.scalpType}</p>
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
          <div style={{ background: C.goldBg, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.goldLight}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: C.gold }}>💬 스타일리스트 메모</h3>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>{visit.note}</p>
          </div>
        )}

        {/* 만족도 */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>💛 소감 남기기</h3>

          {satSubmitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💛</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginBottom: 6 }}>감사합니다 💛</p>
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
                      border: `2px solid ${q1 === v ? C.gold : C.border}`,
                      background: q1 === v ? C.goldBg : "#fff",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 2,
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 24 }}>{e}</span>
                      <span style={{ fontSize: 10, color: q1 === v ? C.gold : C.muted, fontWeight: q1 === v ? 700 : 400 }}>{v}점</span>
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
                      border: `1.5px solid ${q2 === v ? C.gold : C.border}`,
                      background: q2 === v ? C.goldBg : "#fff",
                      color: q2 === v ? C.gold : C.text,
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
                      border: `1.5px solid ${q3 === v ? C.gold : C.border}`,
                      background: q3 === v ? C.goldBg : "#fff",
                      color: q3 === v ? C.gold : C.text,
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
                  background: (q1 && q2 && q3 && !satSubmitting) ? C.gold : C.border,
                  color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                  cursor: (q1 && q2 && q3 && !satSubmitting) ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {satSubmitting ? "저장 중..." : "💛 소감 남기기"}
              </button>
            </>
          )}
        </div>

        {/* 하단 */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>소감</p>
          <p style={{ fontSize: 11, color: C.muted }}>다음 방문에도 건강한 두피로 만나요 ✦</p>
        </div>
      </div>
    </div>
  );
}
