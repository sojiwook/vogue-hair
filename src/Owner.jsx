import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OWNER_PASSWORD = "vogue2026";

const C = {
  bg: "#f8f6f2", card: "#fff", border: "#ede8e0",
  gold: "#b8965a", goldBg: "#fdf8f0", goldLight: "#d4b07a",
  text: "#1a1a1a", sub: "#666", muted: "#999",
  red: "#d94f4f", green: "#3a8c5c", blue: "#3a6fa8",
};

const STYLISTS = ["이서", "승미", "우기"];

function Card({ children, style }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "18px 16px", marginBottom: 12, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 14, fontWeight: 700, color: C.sub,
      marginBottom: 14, marginTop: 2,
      paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {children}
    </div>
  );
}

function StatRow({ label, value, sub, color, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingBottom: last ? 0 : 10, marginBottom: last ? 0 : 10,
      borderBottom: last ? "none" : `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || C.text }}>
        {value}
        {sub && <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, marginLeft: 4 }}>{sub}</span>}
      </span>
    </div>
  );
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ flex: 1, height: 7, background: "#eee8df", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || C.gold, borderRadius: 4, transition: "width 0.5s ease" }} />
    </div>
  );
}

function MiniBar({ label, value, max, color, unit = "명" }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: color || C.gold }}>{value}{unit}</span>
      </div>
      <Bar value={value} max={max} color={color} />
    </div>
  );
}

function SparkBars({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 56, marginTop: 10, marginBottom: 4 }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max(4, Math.round((d.count / max) * 50));
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: isLast ? 700 : 400, color: isLast ? C.gold : C.muted }}>{d.count}</span>
            <div style={{
              width: "100%", height: h,
              background: isLast ? C.gold : "#d4b07a44",
              borderRadius: "3px 3px 0 0",
            }} />
            <span style={{ fontSize: 9, color: isLast ? C.gold : C.muted, fontWeight: isLast ? 700 : 400 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, color, note }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "16px 14px 14px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || C.gold, lineHeight: 1.1 }}>
        {value}
      </div>
      {note && <div style={{ fontSize: 11, color: C.sub }}>{note}</div>}
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = () => {
    if (pw === OWNER_PASSWORD) { onUnlock(); }
    else { setErr(true); setPw(""); }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, letterSpacing: 1, marginBottom: 4 }}>VOGUE HAIR</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 32 }}>원장님 전용 대시보드</div>
      <Card style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>비밀번호 입력</div>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="비밀번호"
          autoFocus
          style={{
            width: "100%", padding: "11px 12px", borderRadius: 8,
            border: `1.5px solid ${err ? C.red : C.border}`,
            fontSize: 15, outline: "none", boxSizing: "border-box",
            marginBottom: err ? 6 : 14, background: C.bg,
          }}
        />
        {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>비밀번호가 올바르지 않습니다.</div>}
        <button
          onClick={submit}
          style={{
            width: "100%", padding: "12px 0", background: C.gold, color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer",
          }}
        >
          확인
        </button>
      </Card>
    </div>
  );
}

export default function Owner() {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (unlocked) loadData();
  }, [unlocked]);

  async function loadData() {
    setLoading(true);
    try {
      const [customersRes, visitsRes, surveysRes] = await Promise.all([
        supabase.from("customers").select("id,gender,birth_date,age,stylist,created_at"),
        // stylist은 visits 테이블에 없음 — customers.stylist로 집계
        supabase.from("visits").select("id,customer_id,date,moisture,elasticity,kakao_message"),
        // FIX ⑤: scalp_concerns 컬럼 사용
        supabase.from("surveys").select("id,customer_id,scalp_concerns"),
      ]);

      const customers = customersRes.data || [];
      const visits = visitsRes.data || [];
      const surveys = surveysRes.data || [];

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // ── 고객 현황 ──────────────────────────────────────────
      const totalCustomers = customers.length;
      const newThisMonth = customers.filter(c => c.created_at?.startsWith(thisMonth)).length;

      const genderCount = { 여: 0, 남: 0, 기타: 0 };
      customers.forEach(c => {
        if (c.gender === "여") genderCount["여"]++;
        else if (c.gender === "남") genderCount["남"]++;
        else genderCount["기타"]++;
      });

      const ageGroups = { "10대": 0, "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대+": 0, "미기재": 0 };
      customers.forEach(c => {
        const yr = c.birth_date ? parseInt(c.birth_date.split("-")[0]) : null;
        const age = yr ? now.getFullYear() - yr : (c.age || null);
        if (!age) { ageGroups["미기재"]++; return; }
        if (age < 20) ageGroups["10대"]++;
        else if (age < 30) ageGroups["20대"]++;
        else if (age < 40) ageGroups["30대"]++;
        else if (age < 50) ageGroups["40대"]++;
        else if (age < 60) ageGroups["50대"]++;
        else ageGroups["60대+"]++;
      });

      // ── 방문 현황 ──────────────────────────────────────────
      // FIX ①: v.date 사용
      const visitsThisMonth = visits.filter(v => v.date?.startsWith(thisMonth)).length;

      const last6Months = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${d.getMonth() + 1}월`;
        const count = visits.filter(v => v.date?.startsWith(key)).length;
        last6Months.push({ label, key, count });
      }

      // ④ stylist은 customers 테이블 기준 — customer_id로 매핑
      const customerStylistMap = {};
      customers.forEach(c => { customerStylistMap[c.id] = c.stylist; });
      const stylistVisits = {};
      STYLISTS.forEach(s => { stylistVisits[s] = 0; });
      visits.forEach(v => {
        const sty = customerStylistMap[v.customer_id];
        if (sty && stylistVisits[sty] !== undefined) stylistVisits[sty]++;
      });

      // ── 두피 건강 ──────────────────────────────────────────
      // FIX ②: 0인 값 제외
      const moistureVals = visits.filter(v => v.moisture != null && v.moisture > 0).map(v => v.moisture);
      const elasticityVals = visits.filter(v => v.elasticity != null && v.elasticity > 0).map(v => v.elasticity);
      const avgMoisture = moistureVals.length
        ? Math.round(moistureVals.reduce((a, b) => a + b, 0) / moistureVals.length) : null;
      const avgElasticity = elasticityVals.length
        ? Math.round(elasticityVals.reduce((a, b) => a + b, 0) / elasticityVals.length) : null;
      const avgScore = (avgMoisture != null && avgElasticity != null)
        ? Math.round((avgMoisture + avgElasticity) / 2)
        : (avgMoisture ?? avgElasticity);

      // FIX ⑤: scalp_concerns 컬럼, 배열 타입 처리
      const concernMap = {};
      surveys.forEach(s => {
        if (!s.scalp_concerns) return;
        const items = Array.isArray(s.scalp_concerns)
          ? s.scalp_concerns.filter(Boolean)
          : String(s.scalp_concerns).split(",").map(x => x.trim()).filter(Boolean);
        items.forEach(item => { concernMap[item] = (concernMap[item] || 0) + 1; });
      });
      const top5Concerns = Object.entries(concernMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count }));

      // ── 재방문 지표 ────────────────────────────────────────
      // FIX ③: v.date 사용
      const visitsByCustomer = {};
      visits.forEach(v => {
        if (!visitsByCustomer[v.customer_id]) visitsByCustomer[v.customer_id] = [];
        visitsByCustomer[v.customer_id].push(v.date);
      });

      const multiVisitCounts = Object.values(visitsByCustomer).filter(arr => arr.length > 1).length;
      const revisitRate = totalCustomers > 0 ? Math.round((multiVisitCounts / totalCustomers) * 100) : 0;

      const gapDays = [];
      Object.values(visitsByCustomer).forEach(dates => {
        if (dates.length < 2) return;
        const sorted = dates.filter(Boolean).sort();
        for (let i = 1; i < sorted.length; i++) {
          const diff = Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24));
          if (diff > 0 && diff < 365) gapDays.push(diff);
        }
      });
      const avgGapDays = gapDays.length
        ? Math.round(gapDays.reduce((a, b) => a + b, 0) / gapDays.length) : null;

      const gapBuckets = { "~2주": 0, "2~4주": 0, "4~8주": 0, "8주+": 0 };
      gapDays.forEach(d => {
        if (d <= 14) gapBuckets["~2주"]++;
        else if (d <= 28) gapBuckets["2~4주"]++;
        else if (d <= 56) gapBuckets["4~8주"]++;
        else gapBuckets["8주+"]++;
      });

      // ── 리포트 발송 ────────────────────────────────────────
      // FIX ④: kakao_message != null 기준
      const totalSent = visits.filter(v => v.kakao_message != null).length;
      const sentThisMonth = visits.filter(v => v.kakao_message != null && v.date?.startsWith(thisMonth)).length;
      const visitsThisMonthCount = visits.filter(v => v.date?.startsWith(thisMonth)).length;
      const sendRate = visitsThisMonthCount > 0 ? Math.round((sentThisMonth / visitsThisMonthCount) * 100) : 0;

      setData({
        customers: { total: totalCustomers, newThisMonth, genderCount, ageGroups },
        visits: { thisMonth: visitsThisMonth, last6Months, stylistVisits },
        scalp: { avgMoisture, avgElasticity, avgScore, top5Concerns },
        revisit: { rate: revisitRate, avgGapDays, gapBuckets },
        report: { totalSent, sentThisMonth, sendRate },
      });
    } catch (e) {
      console.error("[Owner] 데이터 로드 오류:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 헤더 */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: 0.5 }}>VOGUE HAIR</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>원장님 대시보드</div>
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          style={{
            fontSize: 12, color: C.sub, background: "none",
            border: `1px solid ${C.border}`, borderRadius: 7,
            padding: "6px 12px", cursor: "pointer",
          }}
        >
          홈으로
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 14px 48px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>
            데이터 불러오는 중...
          </div>
        )}

        {!loading && data && (
          <>
            {/* KPI 핵심 지표 4개 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <KpiCard
                label="총 고객"
                value={`${data.customers.total}명`}
                note={`이번달 신규 +${data.customers.newThisMonth}명`}
                color={C.gold}
              />
              <KpiCard
                label="이번달 방문"
                value={`${data.visits.thisMonth}회`}
                note={`전월 ${data.visits.last6Months[4]?.count ?? 0}회`}
                color={C.blue}
              />
              <KpiCard
                label="재방문율"
                value={`${data.revisit.rate}%`}
                note={data.revisit.avgGapDays ? `평균 ${data.revisit.avgGapDays}일 주기` : "방문 데이터 축적 중"}
                color={data.revisit.rate >= 50 ? C.green : C.gold}
              />
              <KpiCard
                label="평균 두피 점수"
                value={data.scalp.avgScore != null ? `${data.scalp.avgScore}점` : "—"}
                note={data.scalp.avgMoisture != null ? `수분 ${data.scalp.avgMoisture} · 탄력 ${data.scalp.avgElasticity ?? "—"}` : "분석 데이터 축적 중"}
                color={C.gold}
              />
            </div>

            {/* 1. 고객 현황 */}
            <Card>
              <SectionTitle>👥 고객 현황</SectionTitle>
              <StatRow label="전체 고객" value={`${data.customers.total}명`} />
              <StatRow label="이번달 신규 등록" value={`${data.customers.newThisMonth}명`} color={C.green} last />

              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>성별 분포</div>
              {["여", "남", "기타"].map(g =>
                data.customers.genderCount[g] > 0 && (
                  <MiniBar
                    key={g}
                    label={g}
                    value={data.customers.genderCount[g]}
                    max={data.customers.total}
                    color={g === "여" ? "#c7789a" : g === "남" ? C.blue : C.muted}
                  />
                )
              )}

              <div style={{ marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>연령대 분포</div>
              {Object.entries(data.customers.ageGroups)
                .filter(([, v]) => v > 0)
                .map(([label, value]) => (
                  <MiniBar key={label} label={label} value={value} max={data.customers.total} />
                ))}
            </Card>

            {/* 2. 방문 현황 */}
            <Card>
              <SectionTitle>📅 방문 현황</SectionTitle>
              <StatRow label="이번달 방문" value={`${data.visits.thisMonth}회`} color={C.blue} />
              <StatRow
                label="스타일리스트 최다 방문"
                value={(() => {
                  const top = Object.entries(data.visits.stylistVisits).sort((a, b) => b[1] - a[1])[0];
                  return top ? `${top[0]} (${top[1]}회)` : "—";
                })()}
                last
              />

              <div style={{ marginTop: 14, marginBottom: 4, fontSize: 12, fontWeight: 600, color: C.sub }}>최근 6개월 방문 추이</div>
              <SparkBars data={data.visits.last6Months} color={C.gold} />

              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>스타일리스트별 방문</div>
              {STYLISTS.map(s => (
                <MiniBar
                  key={s} label={s}
                  value={data.visits.stylistVisits[s] || 0}
                  max={Math.max(...Object.values(data.visits.stylistVisits), 1)}
                  unit="회"
                />
              ))}
            </Card>

            {/* 3. 두피 건강 */}
            <Card>
              <SectionTitle>🔬 두피 건강</SectionTitle>
              <StatRow label="평균 두피 수분도" value={data.scalp.avgMoisture != null ? `${data.scalp.avgMoisture}점` : "—"} color={C.blue} />
              <StatRow label="평균 모낭 탄력도" value={data.scalp.avgElasticity != null ? `${data.scalp.avgElasticity}점` : "—"} color={C.blue} last />

              {data.scalp.top5Concerns.length > 0 ? (
                <>
                  <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>두피 고민 TOP 5</div>
                  {data.scalp.top5Concerns.map((c, i) => (
                    <MiniBar
                      key={c.label}
                      label={`${i + 1}. ${c.label}`}
                      value={c.count}
                      max={data.scalp.top5Concerns[0].count}
                      color={C.goldLight}
                    />
                  ))}
                </>
              ) : (
                <div style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>두피 고민 데이터 없음</div>
              )}
            </Card>

            {/* 4. 재방문 지표 */}
            <Card>
              <SectionTitle>🔄 재방문 지표</SectionTitle>
              <StatRow
                label="재방문율"
                value={`${data.revisit.rate}%`}
                color={data.revisit.rate >= 50 ? C.green : C.gold}
              />
              <StatRow
                label="평균 재방문 주기"
                value={data.revisit.avgGapDays != null ? `${data.revisit.avgGapDays}일` : "—"}
                sub={data.revisit.avgGapDays ? `(약 ${Math.round(data.revisit.avgGapDays / 7)}주)` : ""}
                last
              />

              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>방문 주기 분포</div>
              {Object.entries(data.revisit.gapBuckets).map(([label, value]) => (
                <MiniBar
                  key={label} label={label} value={value}
                  max={Math.max(...Object.values(data.revisit.gapBuckets), 1)}
                  color={C.blue} unit="건"
                />
              ))}
            </Card>

            {/* 5. 리포트 발송 */}
            <Card>
              <SectionTitle>📨 리포트 발송</SectionTitle>
              <StatRow label="총 카카오 발송" value={`${data.report.totalSent}건`} />
              <StatRow label="이번달 발송" value={`${data.report.sentThisMonth}건`} />
              <StatRow
                label="이번달 발송률"
                value={`${data.report.sendRate}%`}
                color={data.report.sendRate >= 70 ? C.green : data.report.sendRate >= 40 ? C.gold : C.red}
                last
              />
              <div style={{
                marginTop: 12, padding: "9px 12px",
                background: C.goldBg, borderRadius: 8,
                fontSize: 12, color: C.sub, lineHeight: 1.5,
              }}>
                이번달 방문 고객 중 카카오 리포트를 발송한 비율입니다.
              </div>
            </Card>

            <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 8, paddingBottom: 8 }}>
              {new Date().toLocaleString("ko-KR")} 기준
            </div>
          </>
        )}
      </div>
    </div>
  );
}
