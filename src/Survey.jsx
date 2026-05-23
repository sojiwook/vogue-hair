// Survey.jsx 최종 버전
import { useState } from "react";

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

function Survey() {
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
    try {
      const res = await fetch("/api/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new", form }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      setDone(true);
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
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
            <p style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>소감</p>
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
            <p style={{ fontSize: 12, fontWeight: 900, color: C.text }}>소감</p>
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

function RevisitSurvey() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    phone: "",
    scalp_change: "",
    sleep_change: "",
    stress_change: "",
    action_taken: "",
    action_effect: "",
    scalp_concerns: [],
  });
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
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

  const checkPhone = async () => {
    if (!form.phone) return;
    setChecking(true);
    setPhoneChecked(false);
    setCustomer(null);
    try {
      const res = await fetch("/api/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "check-phone", phone: form.phone }),
      });
      const data = await res.json();
      if (data.found) {
        setCustomer({ id: data.id, name: data.name, phone: data.phone, lastDate: data.lastDate, daysSince: data.daysSince });
      }
    } catch {}
    setPhoneChecked(true);
    setChecking(false);
  };

  const submit = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "revisit",
          form: { ...form, customerName: customer.name },
          customerId: customer.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      setDone(true);
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "본인 확인", emoji: "👋",
      content: (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>전화번호</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={form.phone}
                onChange={e => { set("phone", e.target.value); setPhoneChecked(false); setCustomer(null); }}
                onKeyDown={e => e.key === "Enter" && checkPhone()}
                placeholder="010-0000-0000"
                style={{ flex: 1, padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
              <button
                onClick={checkPhone}
                disabled={!form.phone || checking}
                style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: form.phone && !checking ? C.gold : C.border, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: form.phone && !checking ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}
              >{checking ? "확인 중" : "확인"}</button>
            </div>
          </div>
          {phoneChecked && customer && (
            <div style={{ background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.green }}>{customer.name}님, 반가워요 👋</p>
              {customer.daysSince !== null && (
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>지난 방문으로부터 {customer.daysSince}일이 됐어요</p>
              )}
            </div>
          )}
          {phoneChecked && !customer && (
            <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>등록된 고객 정보가 없어요.</p>
              <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>신규 문진을 작성해주세요.</p>
            </div>
          )}
        </div>
      ),
      canNext: phoneChecked && !!customer,
    },
    {
      title: "몸 신호 알아차림", emoji: "🌿", desc: "요즘 두피나 머리카락에서 달라진 게 느껴지나요?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { v: "좋아진 느낌이에요", e: "😊" },
            { v: "비슷한 것 같아요", e: "😐" },
            { v: "더 신경 쓰여요", e: "😟" },
            { v: "잘 모르겠어요", e: "🤔" },
          ].map(({ v, e }) => (
            <OptionBtn key={v} label={`${e} ${v}`} selected={form.scalp_change === v} onClick={() => set("scalp_change", v)} />
          ))}
        </div>
      ),
      canNext: !!form.scalp_change,
    },
    {
      title: "생활 변화", emoji: "☀️",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>지난번보다 잠을 잘 자고 있나요?</p>
            <div style={{ display: "grid", gap: 8 }}>
              {["잘 자요", "비슷해요", "못 자요"].map(v => (
                <OptionBtn key={v} label={v} selected={form.sleep_change === v} onClick={() => set("sleep_change", v)} />
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>지난번보다 스트레스가 어떤가요?</p>
            <div style={{ display: "grid", gap: 8 }}>
              {["줄었어요", "비슷해요", "늘었어요"].map(v => (
                <OptionBtn key={v} label={v} selected={form.stress_change === v} onClick={() => set("stress_change", v)} />
              ))}
            </div>
          </div>
        </div>
      ),
      canNext: !!form.sleep_change && !!form.stress_change,
    },
    {
      title: "행동 변화", emoji: "✨", desc: "지난번 추천받은 것 중 실천해본 게 있나요?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { v: "제품 바꿨어요", e: "🧴" },
            { v: "생활 습관 바꿨어요", e: "🌿" },
            { v: "둘 다 했어요", e: "✨" },
            { v: "못 했어요", e: "😅" },
          ].map(({ v, e }) => (
            <OptionBtn key={v} label={`${e} ${v}`} selected={form.action_taken === v} onClick={() => { set("action_taken", v); if (v === "못 했어요") set("action_effect", ""); }} />
          ))}
          {form.action_taken && form.action_taken !== "못 했어요" && (
            <div style={{ marginTop: 8, padding: 16, background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>효과가 느껴지셨나요?</p>
              <div style={{ display: "grid", gap: 8 }}>
                {["네, 느껴져요", "잘 모르겠어요", "아직 없어요"].map(v => (
                  <OptionBtn key={v} label={v} selected={form.action_effect === v} onClick={() => set("action_effect", v)} />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      canNext: !!form.action_taken,
    },
    {
      title: "오늘 집중할 부분", emoji: "🔍", desc: "오늘 특별히 봐줬으면 하는 부분이 있나요?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["두피 가려움", "탈모·볼륨", "두피 트러블", "건조함", "지성·냄새", "모발 손상"].map(v => (
            <OptionBtn key={v} label={v} selected={form.scalp_concerns.includes(v)} onClick={() => toggleConcern(v)} />
          ))}
        </div>
      ),
      canNext: form.scalp_concerns.length > 0,
    },
  ];

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>💛</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, color: C.text }}>{customer?.name}님, 문진이 완료됐어요 💛</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.8 }}>소감이 꼼꼼히 살펴볼게요</p>
          <div style={{ marginTop: 24, background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>소감</p>
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
            <p style={{ fontSize: 12, fontWeight: 900, color: C.text }}>소감</p>
            <p style={{ fontSize: 10, color: C.muted }}>재방문 문진표</p>
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
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: "#fff", fontSize: 15, fontFamily: "inherit", cursor: "pointer", color: C.sub }}>← 이전</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!current.canNext} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: current.canNext ? C.gold : C.border, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: current.canNext ? "pointer" : "not-allowed", transition: "all 0.2s" }}>다음 →</button>
          ) : (
            <button onClick={submit} disabled={!current.canNext || saving} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: current.canNext ? C.green : C.border, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: current.canNext ? "pointer" : "not-allowed" }}>{saving ? "저장 중..." : "✓ 제출하기"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");

  const [mode, setMode] = useState(
    typeParam === "revisit" ? "revisit" : typeParam === "new" ? "new" : null
  );

  if (mode === "revisit") return <RevisitSurvey />;
  if (mode === "new") return <Survey />;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>✦</div>
        <p style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: 0.5 }}>소감</p>
      </div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>처음 방문이신가요?</h2>
        <p style={{ fontSize: 14, color: C.sub }}>방문 유형을 선택해주세요</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 360 }}>
        <button
          onClick={() => setMode("new")}
          style={{ width: "100%", padding: "20px 24px", border: `2px solid ${C.gold}`, borderRadius: 16, background: "#fff", color: C.text, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.18s" }}
        >
          <span style={{ fontSize: 26 }}>🌱</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>첫 방문이에요</div>
          </div>
        </button>
        <button
          onClick={() => setMode("revisit")}
          style={{ width: "100%", padding: "20px 24px", border: `2px solid ${C.gold}`, borderRadius: 16, background: "#fff", color: C.text, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.18s" }}
        >
          <span style={{ fontSize: 26 }}>🔄</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>전에 온 적 있어요</div>
          </div>
        </button>
      </div>
    </div>
  );
}
