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

// gender 컬럼값 정규화: "여"/"female"/"f" → "여", "남"/"male"/"m" → "남"
function normalizeGender(g) {
  if (!g) return "기타";
  const v = String(g).toLowerCase().trim();
  if (v === "여" || v === "female" || v === "f" || v === "여성") return "여";
  if (v === "남" || v === "male" || v === "m" || v === "남성") return "남";
  return "기타";
}

function getAgeGroup(customer, now) {
  const yr = customer.birth_date ? parseInt(customer.birth_date.split("-")[0]) : null;
  const age = yr ? now.getFullYear() - yr : (customer.age || null);
  if (!age) return "미기재";
  if (age < 20) return "10대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  if (age < 60) return "50대";
  return "60대+";
}

// ── UI Components ─────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 16px", marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ question, subtitle }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{question}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

function StatRow({ label, value, sub, color, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: last ? 0 : 10, marginBottom: last ? 0 : 10, borderBottom: last ? "none" : `1px solid ${C.border}` }}>
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

function KpiCard({ label, value, color, note }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || C.gold, lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: C.sub }}>{note}</div>}
    </div>
  );
}

function CompareCard({ title, count, rate, rateColor, highlighted }) {
  return (
    <div style={{
      flex: 1,
      background: highlighted ? C.goldBg : C.bg,
      border: `1.5px solid ${highlighted ? C.goldLight : C.border}`,
      borderRadius: 12,
      padding: "14px 14px 12px",
    }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: rateColor, lineHeight: 1 }}>{rate}%</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>재방문율</div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${highlighted ? C.goldLight : C.border}`, fontSize: 11, color: C.sub }}>
        해당 고객 <strong style={{ color: C.text }}>{count}명</strong>
      </div>
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
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
          style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: `1.5px solid ${err ? C.red : C.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: err ? 6 : 14, background: C.bg }}
        />
        {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>비밀번호가 올바르지 않습니다.</div>}
        <button onClick={submit} style={{ width: "100%", padding: "12px 0", background: C.gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          확인
        </button>
      </Card>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────

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
        supabase.from("visits").select("id,customer_id,date,moisture,elasticity,kakao_message"),
        supabase.from("surveys").select("id,customer_id,scalp_concerns,scalp_type"),
      ]);

      const customers = customersRes.data || [];
      const visits    = visitsRes.data  || [];
      const surveys   = surveysRes.data || [];

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // ── visits를 customer별로 그룹화 (날짜 오름차순) ──────
      const visitsByCustomer = {};
      visits.forEach(v => {
        if (!visitsByCustomer[v.customer_id]) visitsByCustomer[v.customer_id] = [];
        visitsByCustomer[v.customer_id].push(v);
      });
      Object.values(visitsByCustomer).forEach(arr =>
        arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      );

      // ── KPI ───────────────────────────────────────────────
      const totalCustomers = customers.length;
      const visitsThisMonth = visits.filter(v => v.date?.startsWith(thisMonth)).length;

      const multiVisitCustomers = Object.values(visitsByCustomer).filter(a => a.length > 1).length;
      const revisitRate = totalCustomers > 0 ? Math.round((multiVisitCustomers / totalCustomers) * 100) : 0;

      const mVals = visits.filter(v => v.moisture > 0).map(v => v.moisture);
      const eVals = visits.filter(v => v.elasticity > 0).map(v => v.elasticity);
      const avgMoisture   = mVals.length ? Math.round(mVals.reduce((a, b) => a + b) / mVals.length) : null;
      const avgElasticity = eVals.length ? Math.round(eVals.reduce((a, b) => a + b) / eVals.length) : null;
      const avgScore = avgMoisture != null && avgElasticity != null
        ? Math.round((avgMoisture + avgElasticity) / 2)
        : (avgMoisture ?? avgElasticity);

      // ── 섹션 1: 리포트 효과 ───────────────────────────────
      const reportedCustomerIds = new Set(
        visits.filter(v => v.kakao_message != null).map(v => v.customer_id)
      );
      const reportedCount    = reportedCustomerIds.size;
      const notReportedCount = totalCustomers - reportedCount;

      let reportedRevisitCount = 0;
      reportedCustomerIds.forEach(cid => {
        if ((visitsByCustomer[cid]?.length || 0) > 1) reportedRevisitCount++;
      });
      const reportedRevisitRate = reportedCount > 0
        ? Math.round((reportedRevisitCount / reportedCount) * 100) : 0;

      let notReportedRevisitCount = 0;
      customers.forEach(c => {
        if (!reportedCustomerIds.has(c.id) && (visitsByCustomer[c.id]?.length || 0) > 1)
          notReportedRevisitCount++;
      });
      const notReportedRevisitRate = notReportedCount > 0
        ? Math.round((notReportedRevisitCount / notReportedCount) * 100) : 0;

      // 리포트 발송 후 → 다음 방문까지 평균 일수
      const daysAfterReport = [];
      visits.filter(v => v.kakao_message != null).forEach(rv => {
        const cvs = visitsByCustomer[rv.customer_id] || [];
        const next = cvs.find(v => v.date > rv.date);
        if (next) {
          const diff = Math.round((new Date(next.date) - new Date(rv.date)) / 86400000);
          if (diff > 0 && diff < 365) daysAfterReport.push(diff);
        }
      });
      const avgDaysAfterReport = daysAfterReport.length
        ? Math.round(daysAfterReport.reduce((a, b) => a + b) / daysAfterReport.length) : null;

      // ── 섹션 2: 방문 주기 ─────────────────────────────────
      const gapDays = [];
      Object.values(visitsByCustomer).forEach(cvs => {
        for (let i = 1; i < cvs.length; i++) {
          if (!cvs[i].date || !cvs[i - 1].date) continue;
          const diff = Math.round((new Date(cvs[i].date) - new Date(cvs[i - 1].date)) / 86400000);
          if (diff > 0 && diff < 365) gapDays.push(diff);
        }
      });
      const avgGapDays = gapDays.length
        ? Math.round(gapDays.reduce((a, b) => a + b) / gapDays.length) : null;

      const gapBuckets = { "2주 이내": 0, "2~4주": 0, "4~8주": 0, "8주+": 0 };
      gapDays.forEach(d => {
        if (d <= 14) gapBuckets["2주 이내"]++;
        else if (d <= 28) gapBuckets["2~4주"]++;
        else if (d <= 56) gapBuckets["4~8주"]++;
        else gapBuckets["8주+"]++;
      });

      // ── 섹션 3: 고객 프로필 ───────────────────────────────
      // 성별 (정규화: "남"/"여"/"male"/"female" 모두 처리)
      const genderCount = { 여: 0, 남: 0, 기타: 0 };
      customers.forEach(c => { genderCount[normalizeGender(c.gender)]++; });

      // customer_id → 연령대 매핑
      const customerAgeGroupMap = {};
      customers.forEach(c => { customerAgeGroupMap[c.id] = getAgeGroup(c, now); });

      // 연령대 × 두피 고민 교차 분석
      const ageGroupConcernsRaw = {};
      surveys.forEach(s => {
        if (!s.scalp_concerns) return;
        const grp = customerAgeGroupMap[s.customer_id] || "미기재";
        const items = Array.isArray(s.scalp_concerns)
          ? s.scalp_concerns.filter(Boolean)
          : String(s.scalp_concerns).split(",").map(x => x.trim()).filter(Boolean);
        if (!ageGroupConcernsRaw[grp]) ageGroupConcernsRaw[grp] = {};
        items.forEach(item => {
          ageGroupConcernsRaw[grp][item] = (ageGroupConcernsRaw[grp][item] || 0) + 1;
        });
      });

      const AGE_ORDER = ["10대", "20대", "30대", "40대", "50대", "60대+", "미기재"];
      const ageGroupConcerns = AGE_ORDER
        .filter(grp => ageGroupConcernsRaw[grp])
        .map(grp => ({
          ageGroup: grp,
          concerns: Object.entries(ageGroupConcernsRaw[grp])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([label, count]) => ({ label, count })),
        }));

      // 두피 타입 분포 (surveys.scalp_type)
      const scalpTypeRaw = {};
      surveys.forEach(s => {
        if (!s.scalp_type) return;
        scalpTypeRaw[s.scalp_type] = (scalpTypeRaw[s.scalp_type] || 0) + 1;
      });
      const scalpTypes = Object.entries(scalpTypeRaw)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }));

      // ── 섹션 4: AI 인사이트 ───────────────────────────────
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

      const insights = [];
      if (top5Concerns.length > 0) {
        insights.push(`${top5Concerns[0].label} 고민 고객이 ${top5Concerns[0].count}명으로 가장 많습니다.`);
      }
      const reportDiff = reportedRevisitRate - notReportedRevisitRate;
      if (reportedCount > 0 && notReportedCount > 0) {
        if (reportDiff > 0) {
          insights.push(`리포트 발송 고객의 재방문율이 미발송 고객보다 ${reportDiff}%p 높습니다.`);
        } else {
          insights.push(`리포트 발송 ${reportedCount}명 중 ${reportedRevisitRate}%가 재방문했습니다.`);
        }
      } else if (reportedCount > 0) {
        insights.push(`리포트 발송 고객 ${reportedCount}명 중 ${reportedRevisitRate}%가 재방문했습니다.`);
      }
      if (avgGapDays) {
        insights.push(`평균 방문 주기는 ${avgGapDays}일(약 ${Math.round(avgGapDays / 7)}주)입니다.`);
      }
      const majorGender = genderCount["여"] >= genderCount["남"] ? "여성" : "남성";
      const topAgeGroup = Object.entries(ageGroupConcernsRaw)
        .filter(([g]) => g !== "미기재")
        .map(([g, concerns]) => [g, Object.values(concerns).reduce((a, b) => a + b, 0)])
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topAgeGroup && top5Concerns.length > 0) {
        insights.push(`${topAgeGroup} ${majorGender} ${top5Concerns[0].label} 두피 고객이 핵심 타겟입니다.`);
      }
      if (avgScore != null) {
        insights.push(`전체 고객 평균 두피 점수는 ${avgScore}점입니다.`);
      }

      setData({
        kpi: { totalCustomers, visitsThisMonth, revisitRate, avgScore, avgMoisture, avgElasticity },
        reportEffect: { reportedCount, notReportedCount, reportedRevisitRate, notReportedRevisitRate, avgDaysAfterReport, reportDiff },
        visitCycle: { avgGapDays, gapBuckets, totalGaps: gapDays.length },
        profile: { genderCount, ageGroupConcerns, scalpTypes },
        insights,
        top5Concerns,
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
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: 0.5 }}>VOGUE HAIR</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>원장님 대시보드</div>
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          style={{ fontSize: 12, color: C.sub, background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}
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
            {/* KPI 4개 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <KpiCard
                label="총 고객"
                value={`${data.kpi.totalCustomers}명`}
                color={C.gold}
                note="전체 등록 고객 수"
              />
              <KpiCard
                label="이번달 방문"
                value={`${data.kpi.visitsThisMonth}회`}
                color={C.blue}
                note="이번달 누적 방문"
              />
              <KpiCard
                label="전체 재방문율"
                value={`${data.kpi.revisitRate}%`}
                color={data.kpi.revisitRate >= 50 ? C.green : C.gold}
                note="2회 이상 방문 고객"
              />
              <KpiCard
                label="평균 두피 점수"
                value={data.kpi.avgScore != null ? `${data.kpi.avgScore}점` : "—"}
                color={C.gold}
                note={
                  data.kpi.avgMoisture != null
                    ? `수분 ${data.kpi.avgMoisture} · 탄력 ${data.kpi.avgElasticity ?? "—"}`
                    : "AI 분석 데이터 축적 중"
                }
              />
            </div>

            {/* ── 섹션 1: 리포트 효과 증명 ── */}
            <Card>
              <SectionHeader
                question="📊 리포트가 재방문을 만들고 있는가?"
                subtitle="카카오 알림톡 발송 여부에 따른 재방문율 비교"
              />

              {data.reportEffect.reportedCount === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  아직 카카오 리포트 발송 기록이 없습니다.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <CompareCard
                      title="📨 리포트 받은 고객"
                      count={data.reportEffect.reportedCount}
                      rate={data.reportEffect.reportedRevisitRate}
                      rateColor={data.reportEffect.reportedRevisitRate >= 50 ? C.green : C.gold}
                      highlighted
                    />
                    <CompareCard
                      title="리포트 없는 고객"
                      count={data.reportEffect.notReportedCount}
                      rate={data.reportEffect.notReportedRevisitRate}
                      rateColor={data.reportEffect.notReportedRevisitRate >= 50 ? C.green : C.sub}
                      highlighted={false}
                    />
                  </div>

                  {data.reportEffect.reportDiff > 0 && (
                    <div style={{ background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                        ✅ 리포트 발송 고객의 재방문율이 {data.reportEffect.reportDiff}%p 높습니다
                      </span>
                    </div>
                  )}
                  {data.reportEffect.reportDiff <= 0 && data.reportEffect.notReportedCount > 0 && (
                    <div style={{ background: "#fff8e6", border: `1px solid ${C.goldLight}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>
                        📌 데이터가 쌓일수록 발송 효과가 뚜렷해집니다
                      </span>
                    </div>
                  )}

                  {data.reportEffect.avgDaysAfterReport != null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: C.blue, lineHeight: 1 }}>
                        {data.reportEffect.avgDaysAfterReport}일
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>리포트 발송 후 평균 재방문 일수</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          약 {Math.round(data.reportEffect.avgDaysAfterReport / 7)}주 후 다시 방문합니다
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.muted }}>
                      리포트 발송 후 재방문 데이터가 아직 없습니다.
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* ── 섹션 2: 방문 주기 ── */}
            <Card>
              <SectionHeader
                question="🔄 고객이 더 자주 오고 있는가?"
                subtitle="2회 이상 방문 고객의 방문 간격 분포"
              />

              {data.visitCycle.totalGaps === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  재방문 데이터가 아직 없습니다.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, lineHeight: 1 }}>
                      {data.visitCycle.avgGapDays}일
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>전체 평균 방문 주기</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        약 {Math.round(data.visitCycle.avgGapDays / 7)}주마다 방문
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: C.sub }}>방문 주기 분포</div>
                  {Object.entries(data.visitCycle.gapBuckets).map(([label, value]) => (
                    <MiniBar
                      key={label} label={label} value={value}
                      max={Math.max(...Object.values(data.visitCycle.gapBuckets), 1)}
                      color={C.blue} unit="건"
                    />
                  ))}
                </>
              )}
            </Card>

            {/* ── 섹션 3: 고객 프로필 ── */}
            <Card>
              <SectionHeader
                question="👥 누가 어떤 문제를 갖고 있는가?"
                subtitle="성별·연령대·두피 고민·두피 타입 분포"
              />

              {/* 성별 + 두피 타입 2컬럼 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>성별 분포</div>
                  {["여", "남", "기타"].map(g =>
                    data.profile.genderCount[g] > 0 && (
                      <MiniBar
                        key={g} label={g} value={data.profile.genderCount[g]}
                        max={data.kpi.totalCustomers}
                        color={g === "여" ? "#c7789a" : g === "남" ? C.blue : C.muted}
                      />
                    )
                  )}
                  {data.profile.genderCount["여"] === 0 && data.profile.genderCount["남"] === 0 && (
                    <div style={{ fontSize: 11, color: C.muted }}>성별 데이터 없음</div>
                  )}
                </div>

                <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>두피 타입</div>
                  {data.profile.scalpTypes.length > 0
                    ? data.profile.scalpTypes.map(({ label, count }) => (
                        <MiniBar key={label} label={label} value={count}
                          max={data.profile.scalpTypes[0].count} color={C.goldLight}
                        />
                      ))
                    : <div style={{ fontSize: 11, color: C.muted }}>문진 데이터 없음</div>
                  }
                </div>
              </div>

              {/* 연령대별 두피 고민 교차 분석 */}
              {data.profile.ageGroupConcerns.length > 0 ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>연령대별 두피 고민 TOP 3</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.profile.ageGroupConcerns.map(({ ageGroup, concerns }) => (
                      <div key={ageGroup} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: C.bg, borderRadius: 10 }}>
                        <div style={{ minWidth: 38, fontSize: 12, fontWeight: 800, color: C.gold, paddingTop: 2 }}>
                          {ageGroup}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {concerns.map((c, i) => (
                            <span key={c.label} style={{
                              fontSize: 11, padding: "3px 9px", borderRadius: 99,
                              background: i === 0 ? C.gold : "#fff",
                              color: i === 0 ? "#fff" : C.sub,
                              border: `1px solid ${i === 0 ? C.gold : C.border}`,
                              fontWeight: i === 0 ? 700 : 400,
                            }}>
                              {c.label} {c.count}명
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: C.muted }}>문진 데이터가 없습니다.</div>
              )}
            </Card>

            {/* ── 섹션 4: AI 인사이트 ── */}
            <Card style={{ background: "#1e1a14", border: "none" }}>
              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #3a3020" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>💡 이 데이터로 무엇을 할 수 있는가?</div>
                <div style={{ fontSize: 11, color: "#a0907a", marginTop: 3 }}>데이터 기반 자동 인사이트</div>
              </div>

              {data.insights.length === 0 ? (
                <div style={{ fontSize: 13, color: "#a0907a" }}>데이터가 쌓이면 인사이트가 자동으로 생성됩니다.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.insights.map((text, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ fontSize: 13, color: "#e8dcc8", lineHeight: 1.65 }}>{text}</div>
                    </div>
                  ))}
                </div>
              )}
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
