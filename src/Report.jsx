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

function ScoreRing({ score }) {
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
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>종합 점수</p>
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

function CompareSection({ current, prev }) {
  const metrics = [
    { key: "score",      label: "종합 점수",  higherIsBetter: true },
    { key: "moisture",   label: "수분도",      higherIsBetter: true },
    { key: "elasticity", label: "탄력도",      higherIsBetter: true },
    { key: "sleep",      label: "수면 품질",   higherIsBetter: true },
    { key: "stress",     label: "스트레스",    higherIsBetter: false },
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
  const overallGood = scoreDiff > 0;

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>📈 지난 방문 대비 변화</h3>
        <span style={{ fontSize: 12, color: C.muted }}>기준: {prev.date}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
        {metrics.map(m => {
          const diff = current[m.key] - prev[m.key];
          const improved = m.higherIsBetter ? diff > 0 : diff < 0;
          const color = diff === 0 ? C.muted : improved ? C.green : C.red;
          const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "─";
          return (
            <div key={m.key} style={{ textAlign: "center", background: C.bg, borderRadius: 10, padding: "12px 6px" }}>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color }}>{arrow}{Math.abs(diff)}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{prev[m.key]} → {current[m.key]}</p>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 13, textAlign: "center", fontWeight: 700,
        color: scoreDiff === 0 ? C.muted : overallGood ? C.green : C.red }}>
        {scoreDiff === 0 ? "변화 없음" : overallGood ? "개선되고 있어요 👍" : "관리가 필요해요 ⚠️"}
      </p>
    </div>
  );
}

function renderMd(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const output = [];
  let i = 0;

  const isTableLine = s => s.startsWith('|') && s.split('|').length > 2;
  const isSepLine = s => isTableLine(s) && /^[\|\-\:\s]+$/.test(s);
  const parseRow = s => s.split('|').slice(1, -1).map(c => c.trim());

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (isTableLine(trimmed)) {
      const startI = i;
      const block = [];
      while (i < lines.length && isTableLine(lines[i].trim())) {
        block.push(lines[i].trim());
        i++;
      }
      const headers = parseRow(block[0]);
      const hasSep = block.length > 1 && isSepLine(block[1]);
      const dataRows = block.slice(hasSep ? 2 : 1).map(parseRow);
      output.push(
        <table key={`tbl-${startI}`} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8, marginBottom: 8 }}>
          <thead>
            <tr>
              {headers.map((h, j) => (
                <th key={j} style={{ padding: '7px 10px', textAlign: 'center', border: `1px solid ${C.border}`, background: C.goldBg, fontWeight: 700, color: C.gold }}>{h}</th>
              ))}
            </tr>
          </thead>
          {dataRows.length > 0 && (
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? C.card : C.bg }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${C.border}`, color: C.text }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      );
    } else {
      if (!trimmed) { i++; continue; }
      const headerMatch = trimmed.match(/^#{1,3}\s+(.*)/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();
        if (headerText) {
          output.push(
            <span key={i} style={{ display: 'block', fontWeight: 800, color: C.gold, marginTop: output.length > 0 ? 10 : 0, marginBottom: 4 }}>
              {headerText}
            </span>
          );
        }
      } else {
        const parts = trimmed.split('**');
        output.push(
          <span key={i} style={{ display: 'block', marginBottom: 2 }}>
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} style={{ color: C.gold }}>{part}</strong>
                : <span key={pi}>{part}</span>
            )}
          </span>
        );
      }
      i++;
    }
  }

  return output;
}

function PhotoGrid({ images, borderColor, compact }) {
  const labelMap = { top: '정수리', left: '측두부(좌)', right: '측두부(우)', back: '후두부', full: '전체' };
  const getLabel = (url, i) => {
    if (!url) return `사진 ${i + 1}`;
    const filename = url.split('/').pop()?.split('_')[0] || '';
    return labelMap[filename] || `사진 ${i + 1}`;
  };
  const n = images.length;
  if (n === 0) return null;
  const imgBase = {
    objectFit: "cover", display: "block",
    borderRadius: compact ? 6 : 10,
    ...(borderColor ? { border: `2px solid ${borderColor}` } : { border: `1px solid ${C.border}` }),
  };
  const lbl = (url, i) => (
    <p style={{ fontSize: compact ? 10 : 11, color: compact ? C.muted : C.sub, marginTop: compact ? 2 : 4, fontWeight: 600, marginBottom: 0 }}>
      {getLabel(url, i)}
    </p>
  );
  const gap = compact ? 4 : 8;

  if (n === 1) {
    const sz = compact ? 80 : 160;
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <img src={images[0]} alt={getLabel(images[0], 0)} style={{ ...imgBase, width: sz, height: sz }} />
          {lbl(images[0], 0)}
        </div>
      </div>
    );
  }

  if (n === 5) {
    const sz = compact ? 76 : 140;
    return (
      <div style={{ display: "flex", gap: compact ? 6 : 10, overflowX: "auto", paddingBottom: 4 }}>
        {images.map((url, i) => (
          <div key={i} style={{ flexShrink: 0, textAlign: "center" }}>
            <img src={url} alt={getLabel(url, i)} style={{ ...imgBase, width: sz, height: sz }} />
            {lbl(url, i)}
          </div>
        ))}
      </div>
    );
  }

  if (n === 3) {
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>
          {images.slice(0, 2).map((url, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <img src={url} alt={getLabel(url, i)} style={{ ...imgBase, width: "100%", aspectRatio: "1" }} />
              {lbl(url, i)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: gap }}>
          <div style={{ width: `calc(50% - ${gap / 2}px)`, textAlign: "center" }}>
            <img src={images[2]} alt={getLabel(images[2], 2)} style={{ ...imgBase, width: "100%", aspectRatio: "1" }} />
            {lbl(images[2], 2)}
          </div>
        </div>
      </div>
    );
  }

  // n === 2 (2열) 또는 n === 4 (2×2 그리드)
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>
      {images.map((url, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <img src={url} alt={getLabel(url, i)} style={{ ...imgBase, width: "100%", aspectRatio: "1" }} />
          {lbl(url, i)}
        </div>
      ))}
    </div>
  );
}

export default function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const phone = new URLSearchParams(window.location.search).get("phone");
    if (!phone) { setError("전화번호가 없습니다."); setLoading(false); return; }

    const load = async () => {
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
  const scoreColor = visit.score >= 70 ? C.green : visit.score >= 50 ? "#b07800" : C.red;

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

  console.log('[Report] visit:', visit?.id, visit?.date);
  console.log('[Report] scalp_report:', visit?.scalp_report);
  console.log('[Report] scalp_images:', visit?.scalp_images);
  console.log('[Report] scalpText:', scalpText);
  console.log('[Report] currentImages:', currentImages);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans KR', sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* 헤더 */}
      <div style={{ background: C.gold, padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>VOGUE HAIR WISHCITY</p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>두피 케어 리포트</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{visit.date} · {customer.stylist} 스타일리스트</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* 고객 정보 */}
        <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{customer.name}님</p>
          <p style={{ fontSize: 13, color: C.muted }}>담당: {customer.stylist} · 시술: {visit.service || "두피 케어"}</p>
        </div>

        {/* 종합 점수 */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <ScoreRing score={visit.score} />
          <p style={{ marginTop: 16, fontSize: 14, color: C.sub }}>
            {visit.score >= 70 ? "두피 상태가 양호해요 👍" : visit.score >= 50 ? "조금 더 관리가 필요해요 💆" : "집중 케어가 필요해요 ⚠️"}
          </p>
        </div>

        {/* 지표 */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>📊 상세 지표</h3>
          <MetricBar label="수면 품질" value={visit.sleep} color={C.blue} />
          <MetricBar label="스트레스" value={visit.stress} color={C.red} />
          <MetricBar label="두피 수분" value={visit.moisture} color={C.gold} />
          <MetricBar label="모발 탄력" value={visit.elasticity} color={C.green} />
        </div>

        {/* 전후 비교 */}
        <CompareSection current={visit} prev={prevVisit} />

        {/* 두피 사진 섹션 */}
        {currentImages.length > 0 && (
          prevImages.length > 0 ? (
            /* 전후 비교 레이아웃 */
            <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📸 두피 사진 변화</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 8, textAlign: "center", fontWeight: 700 }}>이전 ({prevVisit.date})</p>
                  <PhotoGrid images={prevImages.slice(0, 5)} compact />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.gold, marginBottom: 8, textAlign: "center", fontWeight: 700 }}>현재 ({visit.date})</p>
                  <PhotoGrid images={currentImages.slice(0, 5)} borderColor={C.goldLight} compact />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
          ) : (
            /* 단독 표시 레이아웃 */
            <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📸 이번 방문 두피 사진</h3>
              <PhotoGrid images={currentImages} borderColor={C.goldLight} />
            </div>
          )
        )}

        {/* AI 두피 분석 */}
        {scalpText && (
          <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>🔬 AI 두피 분석 결과</h3>
            {scalpParsed?.scalpType && scalpParsed.scalpType !== "분석 참조" && (
              <p style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 12 }}>두피 타입: {scalpParsed.scalpType}</p>
            )}
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {renderMd(scalpText)}
            </div>
          </div>
        )}

        {/* 메모 */}
        {visit.note && (
          <div style={{ background: C.goldBg, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.goldLight}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: C.gold }}>💬 스타일리스트 메모</h3>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>{visit.note}</p>
          </div>
        )}

        {/* 하단 */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>보그헤어위시티점</p>
          <p style={{ fontSize: 11, color: C.muted }}>다음 방문에도 건강한 두피로 만나요 ✦</p>
        </div>
      </div>
    </div>
  );
}
