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
        .limit(1);

      if (!visits || visits.length === 0) { setError("방문 기록이 없습니다."); setLoading(false); return; }

      setData({ customer, visit: visits[0] });
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

  const { customer, visit } = data;
  const scoreColor = visit.score >= 70 ? C.green : visit.score >= 50 ? "#b07800" : C.red;

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

        {/* AI 두피 분석 */}
        {visit.scalp_report && (
          <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>🔬 AI 두피 분석 결과</h3>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {visit.scalp_report.split("**").map((part, i) =>
                i % 2 === 1
                  ? <strong key={i} style={{ color: C.gold }}>{part}</strong>
                  : <span key={i}>{part}</span>
              )}
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
