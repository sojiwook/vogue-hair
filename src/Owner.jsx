import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storageKey: "sogam-owner-auth" },
});

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

function LoginGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr("이메일 또는 비밀번호가 올바르지 않습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, letterSpacing: 1, marginBottom: 4 }}>VOGUE HAIR</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 32 }}>원장님 전용 대시보드</div>
      <Card style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>로그인</div>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="이메일"
          autoFocus
          style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: `1.5px solid ${err ? C.red : C.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 10, background: C.bg }}
        />
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="비밀번호"
          style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: `1.5px solid ${err ? C.red : C.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: err ? 6 : 14, background: C.bg }}
        />
        {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{err}</div>}
        <button
          onClick={submit}
          disabled={submitting}
          style={{ width: "100%", padding: "12px 0", background: submitting ? C.goldLight : C.gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: submitting ? "default" : "pointer" }}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </Card>
    </div>
  );
}

function H3Card({ h3 }) {
  const { total, accepted, takeRate, hairLoss, nonHairLoss, verdict, recentOffers } = h3;
  const verdictConfig = {
    pass: { text: "통과: 독립 상품 가치 확인", bg: "#edf7f1", border: "#a8d5b5", color: "#3a8c5c" },
    gray: { text: "회색지대: 표본 확대 필요", bg: "#fff8e6", border: "#f5d682", color: "#b07800" },
    fail: { text: "기각: 재포지셔닝 검토", bg: "#fff0f0", border: "#f5c0c0", color: "#d94f4f" },
  };
  const vd = verdictConfig[verdict];

  return (
    <Card>
      <SectionHeader question="💰 H3: 리포트 지불 실험" subtitle="1만원 지불 의향 측정 — 거절도 데이터" />

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>진행률</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>{total} / 30건</span>
        </div>
        <div style={{ height: 10, background: "#eee8df", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, Math.round((total / 30) * 100))}%`, height: "100%", background: C.gold, borderRadius: 99, transition: "width 0.5s ease" }} />
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>판정 최소 표본: 30건</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: total > 0 ? C.gold : C.muted, lineHeight: 1 }}>
          {total > 0 ? `${takeRate}%` : "—"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>전체 take rate</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{accepted}건 수락 / {total}건 제안</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ background: hairLoss.total > 0 ? "#fff8e6" : C.bg, border: `1.5px solid ${hairLoss.total > 0 ? C.goldLight : C.border}`, borderRadius: 12, padding: "14px 14px 12px" }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>🔴 탈모 고민 고객</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{hairLoss.total > 0 ? `${hairLoss.rate}%` : "—"}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>take rate</div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.sub }}>{hairLoss.accepted}건 수락 / {hairLoss.total}건</div>
        </div>
        <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 14px 12px" }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>비탈모 고객</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.blue, lineHeight: 1 }}>{nonHairLoss.total > 0 ? `${nonHairLoss.rate}%` : "—"}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>take rate</div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.sub }}>{nonHairLoss.accepted}건 수락 / {nonHairLoss.total}건</div>
        </div>
      </div>

      {verdict === "pending" ? (
        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: C.muted }}>⏳ 판정 대기 ({total}/30)</span>
        </div>
      ) : (
        <div style={{ background: vd.bg, border: `1px solid ${vd.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: vd.color }}>{vd.text}</span>
        </div>
      )}

      {recentOffers.length > 0 ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>최근 제안 내역</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentOffers.map(o => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: o.accepted ? "#edf7f1" : "#fff0f0", borderRadius: 9 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{o.accepted ? "✅" : "❌"}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{o.customerName}</span>
                {o.hair_loss_concern && <span style={{ fontSize: 10, background: "#fff8e6", border: `1px solid ${C.goldLight}`, color: C.gold, padding: "2px 7px", borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>탈모</span>}
                <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{o.offered_at ? new Date(o.offered_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : "—"}</span>
                {o.offered_by && <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{o.offered_by.split("@")[0]}</span>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
          아직 제안 기록이 없습니다. 스타일리스트 화면에서 기록해주세요.
        </div>
      )}
    </Card>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function Owner() {
  const [session, setSession] = useState(undefined); // undefined = 확인 중, null = 미로그인, object = 로그인
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      if (!s) { setData(null); hasLoadedRef.current = false; }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !hasLoadedRef.current && session.user?.email === "sojosh@naver.com") {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const [customersRes, visitsRes, surveysRes, satisfactionsRes, offersRes] = await Promise.all([
        supabase.from("customers").select("id,name,phone,gender,birth_date,age,stylist,created_at,is_test"),
        supabase.from("visits").select("id,customer_id,date,moisture,elasticity,kakao_message"),
        supabase.from("surveys").select("id,phone,scalp_concerns,scalp_type"),
        supabase.from("satisfaction").select("id,visit_id,q1_report_helpful,q2_home_care,q3_revisit_intention"),
        supabase.from("report_offers").select("id,customer_id,offered_at,price,accepted,hair_loss_concern,age_group,offered_by,created_at").order("offered_at", { ascending: false }),
      ]);

      const allCustomers     = customersRes.data     || [];
      const allVisits        = visitsRes.data        || [];
      const allSurveys       = surveysRes.data       || [];
      const allSatisfactions = satisfactionsRes.data || [];

      // is_test = true 고객은 대시보드 통계에서 제외
      const testIds   = new Set(allCustomers.filter(c => c.is_test === true).map(c => c.id));
      const customers = allCustomers.filter(c => c.is_test !== true);
      const visits    = allVisits.filter(v => !testIds.has(v.customer_id));

      // phone → 실고객 객체 맵 (is_test 제외된 customers만 사용)
      const phoneToCustomer = {};
      customers.forEach(c => { if (c.phone) phoneToCustomer[c.phone] = c; });

      // surveys를 phone 기준으로 실고객과 직접 연결 (_cust 첨부)
      const surveys = allSurveys
        .filter(s => s.phone && phoneToCustomer[s.phone])
        .map(s => ({ ...s, _cust: phoneToCustomer[s.phone] }));

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

      // 연령대 × 두피 고민 교차 분석 (s._cust에서 age 직접 참조)
      const ageGroupConcernsRaw = {};
      surveys.forEach(s => {
        if (!s.scalp_concerns) return;
        const grp = getAgeGroup(s._cust, now);
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

      // 두피 타입 분포 (surveys.scalp_type — Survey.jsx 저장값 정규화)
      const SCALP_TYPE_NORM = {
        "건성 (당김/건조)": "건성", "지성 (기름짐)": "지성",
        "복합 (부위별 다름)": "복합", "잘 모르겠음": "모름",
      };
      const scalpTypeRaw = {};
      surveys.forEach(s => {
        if (!s.scalp_type) return;
        const lbl = SCALP_TYPE_NORM[s.scalp_type] || s.scalp_type;
        scalpTypeRaw[lbl] = (scalpTypeRaw[lbl] || 0) + 1;
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

      // ── 섹션 5: 만족도 통계 ─────────────────────────────
      const q1Vals = allSatisfactions.filter(s => s.q1_report_helpful > 0).map(s => s.q1_report_helpful);
      const avgQ1 = q1Vals.length
        ? (q1Vals.reduce((a, b) => a + b, 0) / q1Vals.length).toFixed(1)
        : null;

      const q2Map = {};
      allSatisfactions.forEach(s => {
        if (s.q2_home_care) q2Map[s.q2_home_care] = (q2Map[s.q2_home_care] || 0) + 1;
      });
      const q2TotalCount = Object.values(q2Map).reduce((a, b) => a + b, 0);
      const q2Dist = Object.entries(q2Map)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({
          label, count,
          pct: q2TotalCount > 0 ? Math.round((count / q2TotalCount) * 100) : 0,
        }));

      const q3Answered = allSatisfactions.filter(s => s.q3_revisit_intention > 0);
      const q3High = q3Answered.filter(s => s.q3_revisit_intention === 3).length;
      const revisitIntentRate = q3Answered.length > 0
        ? Math.round((q3High / q3Answered.length) * 100)
        : null;

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

      // ── H3 지불 실험 ─────────────────────────────────────
      const allOffers = offersRes.data || [];
      const offers = allOffers.filter(o => !testIds.has(o.customer_id));

      const h3Total = offers.length;
      const h3Accepted = offers.filter(o => o.accepted).length;
      const h3TakeRate = h3Total > 0 ? Math.round((h3Accepted / h3Total) * 100) : 0;

      const hlOffers = offers.filter(o => o.hair_loss_concern);
      const nhlOffers = offers.filter(o => !o.hair_loss_concern);
      const hlTotal = hlOffers.length;
      const hlAccepted = hlOffers.filter(o => o.accepted).length;
      const hlRate = hlTotal > 0 ? Math.round((hlAccepted / hlTotal) * 100) : 0;
      const nhlTotal = nhlOffers.length;
      const nhlAccepted = nhlOffers.filter(o => o.accepted).length;
      const nhlRate = nhlTotal > 0 ? Math.round((nhlAccepted / nhlTotal) * 100) : 0;

      let h3Verdict;
      if (h3Total < 30) h3Verdict = "pending";
      else if (h3TakeRate >= 20) h3Verdict = "pass";
      else if (h3TakeRate >= 10) h3Verdict = "gray";
      else h3Verdict = "fail";

      const cidToName = {};
      allCustomers.forEach(c => { if (c.id && c.name) cidToName[c.id] = c.name; });
      const recentOffers = offers.slice(0, 10).map(o => ({ ...o, customerName: cidToName[o.customer_id] || "—" }));

      setData({
        kpi: { totalCustomers, visitsThisMonth, revisitRate, avgScore, avgMoisture, avgElasticity },
        reportEffect: { reportedCount, notReportedCount, reportedRevisitRate, notReportedRevisitRate, avgDaysAfterReport, reportDiff },
        visitCycle: { avgGapDays, gapBuckets, totalGaps: gapDays.length },
        profile: { genderCount, ageGroupConcerns, scalpTypes },
        satisfaction: { avgQ1, q2Dist, revisitIntentRate, total: allSatisfactions.length, q3Total: q3Answered.length },
        insights,
        top5Concerns,
        h3: { total: h3Total, accepted: h3Accepted, takeRate: h3TakeRate, hairLoss: { total: hlTotal, accepted: hlAccepted, rate: hlRate }, nonHairLoss: { total: nhlTotal, accepted: nhlAccepted, rate: nhlRate }, verdict: h3Verdict, recentOffers },
      });
    } catch (e) {
      console.error("[Owner] 데이터 로드 오류:", e);
    } finally {
      setLoading(false);
    }
  }

  if (session === undefined) return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.muted, fontSize: 14 }}>로딩 중...</p>
    </div>
  );
  if (!session) return <LoginGate />;

  const userEmail = session.user?.email;
  if (userEmail === "vogwooki@naver.com") return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🚫</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>스타일리스트 계정으로 로그인되어 있습니다</p>
        <p style={{ fontSize: 13, color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>스타일리스트 계정은 <a href="/" style={{ color: C.gold, textDecoration: "none", fontWeight: 700 }}>메인 화면</a>에서 로그인해주세요.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: "12px 24px", background: C.gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>확인 (로그아웃)</button>
      </div>
    </div>
  );
  if (userEmail !== "sojosh@naver.com") return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⛔</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>접근 권한이 없습니다</p>
        <p style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>이 계정은 원장님 대시보드에 접근할 수 없습니다.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: "12px 24px", background: C.gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>로그아웃</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: 0.5 }}>VOGUE HAIR</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>원장님 대시보드</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ fontSize: 12, color: C.sub, background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}
          >
            홈으로
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 12, color: C.red, background: "none", border: `1px solid ${C.red}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}
          >
            로그아웃
          </button>
        </div>
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

            {/* ── 섹션 4: 고객 만족도 ── */}
            <Card>
              <SectionHeader
                question="💛 고객 만족도"
                subtitle="리포트 하단 소감 응답 통계"
              />

              {data.satisfaction.total === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  아직 소감 응답이 없습니다.
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>응답 수</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: C.gold }}>{data.satisfaction.total}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>건</div>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>리포트 만족도 평균</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: data.satisfaction.avgQ1 >= 3 ? C.green : C.gold }}>
                        {data.satisfaction.avgQ1 ?? "—"}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>/ 4점</div>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>재방문 의향률</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: data.satisfaction.revisitIntentRate >= 50 ? C.green : C.gold }}>
                        {data.satisfaction.revisitIntentRate != null ? `${data.satisfaction.revisitIntentRate}%` : "—"}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>"꼭 올게요"</div>
                    </div>
                  </div>

                  {data.satisfaction.q2Dist.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>행동 변화 의향 분포 (Q2)</div>
                      {data.satisfaction.q2Dist.map(({ label, count, pct }) => (
                        <MiniBar key={label} label={`${label} (${pct}%)`} value={count}
                          max={data.satisfaction.q2Dist[0].count} color={C.gold} unit="명"
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </Card>

            {/* ── 섹션 5: AI 인사이트 ── */}
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

            <H3Card h3={data.h3} />

            <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 8, paddingBottom: 8 }}>
              {new Date().toLocaleString("ko-KR")} 기준
            </div>
          </>
        )}
      </div>
    </div>
  );
}
