import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  bg: "#f8f6f2", card: "#fff", border: "#ede8e0",
  gold: "#b8965a", goldBg: "#fdf8f0", goldLight: "#d4b07a",
  text: "#1a1a1a", sub: "#666", muted: "#999",
  green: "#3a8c5c",
};

function OptionBtn({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${selected ? C.gold : C.border}`,
      background: selected ? C.goldBg : "#fff", color: selected ? C.gold : C.text,
      fontFamily: "inherit", fontSize: 14, fontWeight: selected ? 700 : 400,
      cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%",
    }}>
      {selected ? "✓ " : ""}{label}
    </button>
  );
}

export default function Survey() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "",
    sleep: "", stress: 0,
    condition: "", scalp_concerns: [],
    shampoo_frequency: "", scalp_type: "",
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
    await supabase.from("surveys").insert({
      name: form.name,
      phone: form.phone,
      sleep: form.sleep,
      stress: form.stress,
      condition: form.condition,
      scalp_concerns: form.scalp_concerns,
      shampoo_frequency: form.shampoo_frequency,
      scalp_type: form.scalp_type,
    });
    setSaving(false);
    setDone(true);
  };

  const steps = [
    // 0: 기본 정보
    {
      title: "기본 정보",
      emoji: "👤",
      content: (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>이름</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="홍길동"
              style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>전화번호</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="010-0000-0000"
              style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      ),
      canNext: form.name && form.phone,
    },
    // 1: 수면
    {
      title: "수면",
      emoji: "😴",
      desc: "요즘 평균 수면 시간은?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["5시간 이하", "5~6시간", "6~7시간", "7시간 이상"].map(v => (
            <OptionBtn key={v} label={v} selected={form.sleep === v} onClick={() => set("sleep", v)} />
          ))}
        </div>
      ),
      canNext: form.sleep,
    },
    // 2: 스트레스
    {
      title: "스트레스",
      emoji: "🧠",
      desc: "지난 1주일 스트레스 강도는?",
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
                fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
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
    // 3: 몸 컨디션
    {
      title: "몸 컨디션",
      emoji: "💪",
      desc: "요즘 전반적인 몸 상태는?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["나쁨", "보통", "좋음"].map(v => (
            <OptionBtn key={v} label={v} selected={form.condition === v} onClick={() => set("condition", v)} />
          ))}
        </div>
      ),
      canNext: form.condition,
    },
    // 4: 두피 고민
    {
      title: "두피 고민",
      emoji: "🔬",
      desc: "신경 쓰이는 두피/모발 고민은? (복수 선택 가능)",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["탈모/숱 감소", "비듬/각질", "가려움/따가움", "유분/냄새", "모발 손상/갈라짐", "특별히 없음"].map(v => (
            <OptionBtn key={v} label={v}
              selected={form.scalp_concerns.includes(v)}
              onClick={() => toggleConcern(v)} />
          ))}
        </div>
      ),
      canNext: form.scalp_concerns.length > 0,
    },
    // 5: 샴푸 주기
    {
      title: "샴푸 주기",
      emoji: "🚿",
      desc: "머리를 얼마나 자주 감으시나요?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["매일", "2일에 한 번", "3일 이상에 한 번"].map(v => (
            <OptionBtn key={v} label={v} selected={form.shampoo_frequency === v} onClick={() => set("shampoo_frequency", v)} />
          ))}
        </div>
      ),
      canNext: form.shampoo_frequency,
    },
    // 6: 두피 타입
    {
      title: "두피 타입",
      emoji: "💆",
      desc: "본인이 느끼는 두피 타입은?",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {["건성 (당김/건조)", "지성 (기름짐)", "복합 (부위별 다름)", "잘 모르겠음"].map(v => (
            <OptionBtn key={v} label={v} selected={form.scalp_type === v} onClick={() => set("scalp_type", v)} />
          ))}
        </div>
      ),
      canNext: form.scalp_type,
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
            더 나은 두피 케어를 위해 활용할게요 😊
          </p>
          <div style={{ marginTop: 24, background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>보그헤어위시티점</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>오늘도 좋은 하루 보내세요 ✦</p>
          </div>
        </div>
      </div>
    );
  }

  const current = steps[step];
  const progress = ((step) / steps.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans KR', sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* 헤더 */}
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

      {/* 진행바 */}
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${progress}%`, background: C.gold, transition: "width 0.3s" }} />
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px 100px" }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>{current.emoji}</span>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 8, marginBottom: 6 }}>{current.title}</h2>
          {current.desc && <p style={{ fontSize: 14, color: C.sub }}>{current.desc}</p>}
        </div>
        {current.content}
      </div>

      {/* 하단 버튼 */}
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
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              cursor: current.canNext ? "pointer" : "not-allowed", transition: "all 0.2s",
            }}>다음 →</button>
          ) : (
            <button onClick={submit} disabled={!current.canNext || saving} style={{
              flex: 2, padding: 14, borderRadius: 12, border: "none",
              background: current.canNext ? C.green : C.border,
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              cursor: current.canNext ? "pointer" : "not-allowed",
            }}>{saving ? "저장 중..." : "✓ 제출하기"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
