// Survey.jsx 최종 버전
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STYLISTS = ["이서", "승미", "우기"];

const C = {
  bg: "#f8f6f2", card: "#fff", border: "#ede8e0",
  gold: "#b8965a", goldBg: "#fdf8f0", goldLight: "#d4b07a",
  text: "#1a1a1a", sub: "#666", muted: "#999",
  green: "#3a8c5c", red: "#d94f4f",
};

function calcAge(birthDate) {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const selectStyle = {
  flex: 1, padding: "12px 8px", border: `1.5px solid ${C.border}`,
  borderRadius: 10, fontSize: 16, fontFamily: "inherit",
  outline: "none", background: "#fff", color: "#1a1a1a",
  textAlign: "center",
};

function BirthDatePicker({ value, onChange }) {
  const initParts = value ? value.split("-") : ["", "", ""];
  const [selYear,  setSelYear]  = useState(initParts[0] || "");
  const [selMonth, setSelMonth] = useState(initParts[1] ? String(Number(initParts[1])) : "");
  const [selDay,   setSelDay]   = useState(initParts[2] ? String(Number(initParts[2])) : "");

  const daysInMonth = (selYear && selMonth)
    ? new Date(Number(selYear), Number(selMonth), 0).getDate()
    : 31;

  const emit = (y, m, d) => {
    if (y && m && d) {
      onChange(`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    } else {
      onChange("");
    }
  };

  const years  = Array.from({ length: 71 }, (_, i) => 2010 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYear = e => {
    const y = e.target.value;
    setSelYear(y);
    emit(y, selMonth, selDay);
  };
  const handleMonth = e => {
    const m = e.target.value;
    const maxDay = m && selYear ? new Date(Number(selYear), Number(m), 0).getDate() : 31;
    const clampedDay = selDay && Number(selDay) > maxDay ? "" : selDay;
    setSelMonth(m);
    setSelDay(clampedDay);
    emit(selYear, m, clampedDay);
  };
  const handleDay = e => {
    const d = e.target.value;
    setSelDay(d);
    emit(selYear, selMonth, d);
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={selYear} onChange={handleYear} style={selectStyle}>
        <option value="">연도</option>
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>
      <select value={selMonth} onChange={handleMonth} style={selectStyle}>
        <option value="">월</option>
        {months.map(m => <option key={m} value={m}>{m}월</option>)}
      </select>
      <select value={selDay} onChange={handleDay} style={selectStyle}>
        <option value="">일</option>
        {days.map(d => <option key={d} value={d}>{d}일</option>)}
      </select>
    </div>
  );
}

function OptionBtn({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 16px", borderRadius: 10,
      border: `1.5px solid ${selected ? C.gold : C.border}`,
      background: selected ? C.goldBg : "#fff",
      color: selected ? C.gold : C.text,
      fontFamily: "inherit", fontSize: 14,
      fontWeight: selected ? 700 : 400,
      cursor: "pointer", transition: "all 0.15s",
      textAlign: "left", width: "100%",
    }}>
      {selected ? "✓ " : ""}{label}
    </button>
  );
}

export default function Survey() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", birth_date: "", gender: "", stylist: STYLISTS[0],
    sleep: "", stress: 0,
    condition: "", scalp_concerns: [],
    shampoo_frequency: "", scalp_type: "",
    marketing_agree: false,
  });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleConcern = (v) => {
    setForm(p => ({
      ...p,
      scalp_concerns: p.scalp_concerns.includes(v)
        ? p.scalp_concerns.filter(x => x !== v)
        : [...p.scalp_concerns, v],
    }));
  };

  const submit = async () => {
    setSaving(true);
    console.log("[Survey] submit 시작 — form:", { sleep: form.sleep, stress: form.stress, condition: form.condition, phone: form.phone });

    const sleepMap = { "5시간 이하": 30, "5~6시간": 50, "6~7시간": 70, "7시간 이상": 85 };
    const condMap = { "나쁨": 35, "보통": 55, "좋음": 75 };

    // 1. surveys 저장
    const { data: existingSurveys, error: surveyQueryErr } = await supabase
      .from("surveys")
      .select("id")
      .eq("phone", form.phone)
      .order("created_at", { ascending: false })
      .limit(1);
    console.log("[Survey] 기존 survey 조회:", existingSurveys, "error:", surveyQueryErr);
    const existingSurvey = existingSurveys?.[0] ?? null;

    if (existingSurvey) {
      const { error: surveyUpdateErr } = await supabase.from("surveys").update({
        name: form.name,
        sleep: form.sleep,
        stress: form.stress,
        condition: form.condition,
        scalp_concerns: form.scalp_concerns,
        shampoo_frequency: form.shampoo_frequency,
        scalp_type: form.scalp_type,
      }).eq("id", existingSurvey.id);
      console.log("[Survey] survey UPDATE error:", surveyUpdateErr);
    } else {
      const { error: surveyInsertErr } = await supabase.from("surveys").insert({
        name: form.name,
        phone: form.phone,
        sleep: form.sleep,
        stress: form.stress,
        condition: form.condition,
        scalp_concerns: form.scalp_concerns,
        shampoo_frequency: form.shampoo_frequency,
        scalp_type: form.scalp_type,
      });
      console.log("[Survey] survey INSERT error:", surveyInsertErr);
    }

    // 2. customers 저장
    const age = calcAge(form.birth_date);
    const { data: existingCustomers, error: customerQueryErr } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", form.phone)
      .limit(1);
    console.log("[Survey] 기존 customer 조회:", existingCustomers, "error:", customerQueryErr);
    const existing = existingCustomers?.[0] ?? null;

    let customerId;
    if (existing) {
      await supabase.from("customers").update({
        stylist: form.stylist,
        gender: form.gender,
        birth_date: form.birth_date || null,
        age,
        marketing_agree: form.marketing_agree,
      }).eq("id", existing.id);
      customerId = existing.id;
      console.log("[Survey] customer UPDATE — customerId:", customerId);
    } else {
      const { data: newCustomer, error: customerInsertErr } = await supabase.from("customers").insert({
        name: form.name,
        phone: form.phone,
        stylist: form.stylist,
        gender: form.gender,
        birth_date: form.birth_date || null,
        age,
        marketing_agree: form.marketing_agree,
        join_date: new Date().toISOString().slice(0, 10),
        memo: "",
      }).select().single();
      console.log("[Survey] customer INSERT — newCustomer:", newCustomer, "error:", customerInsertErr);
      customerId = newCustomer?.id;
    }

    if (!customerId) {
      console.error("[Survey] customerId 없음 — 종료");
      setSaving(false);
      alert("고객 정보 저장에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    // 3. surveys 테이블에서 phone 기준으로 최신 문진 값 재조회 (.single() 제거 — 중복 행 있어도 안전)
    const { data: surveyRows, error: surveyRowErr } = await supabase
      .from("surveys")
      .select("sleep, stress, condition")
      .eq("phone", form.phone)
      .order("created_at", { ascending: false })
      .limit(1);
    const surveyRow = surveyRows?.[0] ?? null;
    console.log("[Survey] surveyRow 재조회:", surveyRow, "error:", surveyRowErr);

    const sleepVal = sleepMap[surveyRow?.sleep] ?? sleepMap[form.sleep] ?? 50;
    const stressVal = Number(surveyRow?.stress ?? form.stress) * 20;
    const moistVal = condMap[surveyRow?.condition] ?? condMap[form.condition] ?? 55;
    const elasticity = 50;
    const score = Math.round(
      sleepVal * 0.2 + (100 - stressVal) * 0.2 + moistVal * 0.3 + elasticity * 0.3
    );
    console.log("[Survey] 계산된 값 — sleepVal:", sleepVal, "stressVal:", stressVal, "moistVal:", moistVal, "score:", score);

    // 4. visits 생성 또는 업데이트 — 로컬 날짜 사용 (UTC 기준이면 KST 오전 9시 이전에 전날 날짜가 들어가는 버그)
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    console.log("[Survey] today (로컬):", today);
    const { data: todayVisits, error: todayVisitsErr } = await supabase
      .from("visits")
      .select("id")
      .eq("customer_id", customerId)
      .eq("date", today)
      .limit(1);
    console.log("[Survey] 오늘 visit 조회 (customer_id:", customerId, ", date:", today, "):", todayVisits, "error:", todayVisitsErr);
    const todayVisit = todayVisits?.[0] ?? null;

    if (todayVisitsErr) {
      console.error("[Survey] visit 조회 오류 — INSERT 생략 (중복 방지):", todayVisitsErr);
    } else if (!todayVisit) {
      const { data: insertedVisit, error: visitInsertErr } = await supabase.from("visits").insert({
        customer_id: customerId,
        date: today,
        service: "두피 케어",
        sleep: sleepVal,
        stress: stressVal,
        moisture: moistVal,
        elasticity,
        score,
      }).select().single();
      console.log("[Survey] visit INSERT — 결과:", insertedVisit, "error:", visitInsertErr);
    } else {
      const { data: updatedVisit, error: visitUpdateErr } = await supabase.from("visits").update({
        sleep: sleepVal,
        stress: stressVal,
        moisture: moistVal,
        elasticity,
        score,
      }).eq("id", todayVisit.id).select().single();
      console.log("[Survey] visit UPDATE (id:", todayVisit.id, ") — 결과:", updatedVisit, "error:", visitUpdateErr);
    }

    setSaving(false);
    setDone(true);
  };

  const steps = [
    {
      title: "기본 정보", emoji: "👤",
      content: (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>이름 *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="홍길동"
              style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>전화번호 *</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="010-0000-0000"
              style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>
              생년월일
              {form.birth_date && <span style={{ marginLeft: 8, color: C.gold, fontWeight: 800 }}>({calcAge(form.birth_date)}세)</span>}
            </label>
            <BirthDatePicker value={form.birth_date} onChange={v => set("birth_date", v)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 10, fontWeight: 600 }}>성별</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["여성", "남성"].map(g => (
                <button key={g} onClick={() => set("gender", g)} style={{
                  padding: "14px 8px", borderRadius: 12,
                  border: `1.5px solid ${form.gender === g ? C.gold : C.border}`,
                  background: form.gender === g ? C.goldBg : "#fff",
                  color: form.gender === g ? C.gold : C.text,
                  fontFamily: "inherit", fontSize: 15, fontWeight: form.gender === g ? 800 : 400,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}>
                  {g === "여성" ? "👩 " : "👨 "}{form.gender === g ? "✓ " : ""}{g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 10, fontWeight: 600 }}>담당 스타일리스트 *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {STYLISTS.map(s => (
                <button key={s} onClick={() => set("stylist", s)} style={{
                  padding: "14px 8px", borderRadius: 12,
                  border: `1.5px solid ${form.stylist === s ? C.gold : C.border}`,
                  background: form.stylist === s ? C.goldBg : "#fff",
                  color: form.stylist === s ? C.gold : C.text,
                  fontFamily: "inherit", fontSize: 15, fontWeight: form.stylist === s ? 800 : 400,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}>
                  {form.stylist === s ? "✓ " : ""}{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      canNext: form.name && form.phone && form.stylist,
    },
    {
      title: "수면", emoji: "😴", desc: "요즘 평균 수면 시간은?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["5시간 이하", "5~6시간", "6~7시간", "7시간 이상"].map(v => (
            <OptionBtn key={v} label={v} selected={form.sleep === v} onClick={() => set("sleep", v)} />
          ))}
        </div>
      ),
      canNext: form.sleep,
    },
    {
      title: "스트레스", emoji: "🧠", desc: "지난 1주일 스트레스 강도는?",
      content: (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.muted }}>거의 없음</span>
            <span style={{ fontSize: 13, color: C.muted }}>매우 심함</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map(v => (
              <button key={v} onClick={() => set("stress", v)} style={{
                width: 56, height: 56, borderRadius: "50%",
                border: `2px solid ${form.stress === v ? C.gold : C.border}`,
                background: form.stress === v ? C.gold : "#fff",
                color: form.stress === v ? "#fff" : C.text,
                fontSize: 18, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}>{v}</button>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: C.gold, fontWeight: 700 }}>
            {form.stress ? `${form.stress}점 선택됨` : "점수를 선택해주세요"}
          </p>
        </div>
      ),
      canNext: form.stress > 0,
    },
    {
      title: "몸 컨디션", emoji: "💪", desc: "요즘 전반적인 몸 상태는?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["나쁨", "보통", "좋음"].map(v => (
            <OptionBtn key={v} label={v} selected={form.condition === v} onClick={() => set("condition", v)} />
          ))}
        </div>
      ),
      canNext: form.condition,
    },
    {
      title: "두피 고민", emoji: "🔬", desc: "신경 쓰이는 두피/모발 고민은? (복수 선택 가능)",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["탈모/숱 감소", "비듬/각질", "가려움/따가움", "유분/냄새", "모발 손상/갈라짐", "특별히 없음"].map(v => (
            <OptionBtn key={v} label={v} selected={form.scalp_concerns.includes(v)} onClick={() => toggleConcern(v)} />
          ))}
        </div>
      ),
      canNext: form.scalp_concerns.length > 0,
    },
    {
      title: "샴푸 주기", emoji: "🚿", desc: "머리를 얼마나 자주 감으시나요?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["매일", "2일에 한 번", "3일 이상에 한 번"].map(v => (
            <OptionBtn key={v} label={v} selected={form.shampoo_frequency === v} onClick={() => set("shampoo_frequency", v)} />
          ))}
        </div>
      ),
      canNext: form.shampoo_frequency,
    },
    {
      title: "두피 타입", emoji: "💆", desc: "본인이 느끼는 두피 타입은?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["건성 (당김/건조)", "지성 (기름짐)", "복합 (부위별 다름)", "잘 모르겠음"].map(v => (
            <OptionBtn key={v} label={v} selected={form.scalp_type === v} onClick={() => set("scalp_type", v)} />
          ))}
        </div>
      ),
      canNext: form.scalp_type,
    },
    {
      title: "약관 동의", emoji: "📋",
      content: (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>개인정보 수집 및 이용 동의 (필수)</p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, marginBottom: 10 }}>
              수집 항목: 이름, 전화번호, 생년월일, 성별<br />
              수집 목적: 두피 케어 서비스 제공<br />
              보유 기간: 서비스 이용 종료 시까지
            </p>
            <div style={{ background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.green, fontWeight: 700 }}>
              ✓ 서비스 이용을 위해 필수 동의됩니다
            </div>
          </div>
          <div onClick={() => set("marketing_agree", !form.marketing_agree)} style={{
            background: form.marketing_agree ? C.goldBg : "#fff",
            border: `1.5px solid ${form.marketing_agree ? C.gold : C.border}`,
            borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                border: `2px solid ${form.marketing_agree ? C.gold : C.border}`,
                background: form.marketing_agree ? C.gold : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
              }}>
                {form.marketing_agree && <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: form.marketing_agree ? C.gold : C.text }}>마케팅 정보 수신 동의 (선택)</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>두피 케어 리포트 및 맞춤 케어 정보를 카카오톡으로 받아보세요</p>
              </div>
            </div>
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, color: C.text }}>감사합니다!</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.8 }}>
            {form.name}님의 소중한 답변을 받았어요.<br />
            담당 {form.stylist} 스타일리스트가 곧 안내해드릴게요 😊
          </p>
          {form.marketing_agree && (
            <div style={{ marginTop: 16, background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>✅ 두피 케어 리포트를 카카오톡으로 보내드릴게요!</p>
            </div>
          )}
          <div style={{ marginTop: 24, background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>보그헤어위시티점</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>오늘도 좋은 하루 보내세요 ✦</p>
          </div>
        </div>
      </div>
    );
  }

  const current = steps[step];
  const progress = (step / steps.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans KR', sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 900, color: C.text }}>보그헤어위시티점</p>
            <p style={{ fontSize: 10, color: C.muted }}>두피 케어 문진표</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{step + 1} / {steps.length}</span>
        </div>
      </div>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${progress}%`, background: C.gold, transition: "width 0.3s" }} />
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px 100px" }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>{current.emoji}</span>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 8, marginBottom: 6 }}>{current.title}</h2>
          {current.desc && <p style={{ fontSize: 14, color: C.sub }}>{current.desc}</p>}
        </div>
        {current.content}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${C.border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`,
              background: "#fff", fontSize: 15, fontFamily: "inherit", cursor: "pointer", color: C.sub,
            }}>← 이전</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!current.canNext} style={{
              flex: 2, padding: 14, borderRadius: 12, border: "none",
              background: current.canNext ? C.gold : C.border,
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "inherit", cursor: current.canNext ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}>다음 →</button>
          ) : (
            <button onClick={submit} disabled={!current.canNext || saving} style={{
              flex: 2, padding: 14, borderRadius: 12, border: "none",
              background: current.canNext ? C.green : C.border,
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "inherit", cursor: current.canNext ? "pointer" : "not-allowed",
            }}>{saving ? "저장 중..." : "✓ 제출하기"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
