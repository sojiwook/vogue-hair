import { useState, useRef } from "react";
const SHOP_NAME = "보그헤어위시티점";
const SHOP_NAME_EN = "VOGUE HAIR WISHCITY";
const T = {
  bg: "#faf9f7", bgDark: "#f3f0eb", card: "#ffffff", border: "#e8e2d9",
  accent: "#2c2c2c", gold: "#b8965a", goldLight: "#d4b07a", goldBg: "#fdf8f0",
  red: "#d94f4f", green: "#3a8c5c", blue: "#3a6fa8",
  text: "#1a1a1a", sub: "#666", muted: "#999", kakao: "#FEE500", white: "#fff",
};
const INIT_CUSTOMERS = [
  { id: 1, name: "김지수", phone: "010-1234-5678", age: 32, stylist: "박민준", joinDate: "2024-03-10", memo: "두피 예민, 향료 알러지",
    visits: [
      { date: "2025-10-12", score: 52, sleep: 38, stress: 80, moisture: 32, elasticity: 48, service: "두피 스케일링", note: "피지 과분비 심함" },
      { date: "2026-01-08", score: 61, sleep: 50, stress: 68, moisture: 42, elasticity: 55, service: "앰플 트리트먼트", note: "전반적 개선" },
      { date: "2026-04-15", score: 69, sleep: 42, stress: 74, moisture: 38, elasticity: 58, service: "두피 정밀 검진", note: "오늘 방문" },
    ],
  },
  { id: 2, name: "이서윤", phone: "010-9876-5432", age: 28, stylist: "최유나", joinDate: "2025-01-20", memo: "염색 선호",
    visits: [
      { date: "2025-11-05", score: 78, sleep: 72, stress: 40, moisture: 65, elasticity: 70, service: "염색 + 트리트먼트", note: "두피 양호" },
      { date: "2026-04-15", score: 74, sleep: 68, stress: 45, moisture: 58, elasticity: 65, service: "두피 정밀 검진", note: "오늘 방문" },
    ],
  },
];
const STYLISTS = ["이서", "승미", "우기"];
function Btn({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 700, borderRadius: 10,
    transition: "all 0.18s", opacity: disabled ? 0.5 : 1,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    ...(size === "sm" ? { fontSize: 12, padding: "7px 14px" } :
       size === "lg" ? { fontSize: 15, padding: "14px 28px" } :
       { fontSize: 13, padding: "10px 20px" }),
    ...(variant === "primary" ? { background: T.accent, color: T.white } :
       variant === "gold" ? { background: T.gold, color: T.white, boxShadow: "0 4px 16px rgba(184,150,90,0.3)" } :
       variant === "kakao" ? { background: T.kakao, color: "#3a1d00" } :
       variant === "ghost" ? { background: "transparent", color: T.sub, border: `1px solid ${T.border}` } :
       variant === "danger" ? { background: "#fff0f0", color: T.red, border: `1px solid #ffcdd2` } :
       { background: T.bg, color: T.text, border: `1px solid ${T.border}` }),
    ...style,
  };
  return <button style={base} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Card({ children, style = {} }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px", ...style }}>{children}</div>;
}
function Input({ label, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <div style={style}>
      {label && <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, background: T.white, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = T.gold}
        onBlur={e => e.target.style.borderColor = T.border} />
    </div>
  );
}
function ScoreChip({ score }) {
  const color = score >= 70 ? T.green : score >= 50 ? "#c07a00" : T.red;
  const bg = score >= 70 ? "#edf7f1" : score >= 50 ? "#fff8e6" : "#fff0f0";
  return <span style={{ fontSize: 12, fontWeight: 800, color, background: bg, padding: "3px 10px", borderRadius: 99 }}>{score}점</span>;
}
function Bar({ value, color }) {
  return <div style={{ height: 5, background: T.bgDark, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99 }} /></div>;
}
function Spark({ values, color }) {
  if (values.length < 2) return null;
  const w = 80, h = 28, p = 3;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const pts = values.map((v, i) => [p + (i / (values.length - 1)) * (w - p * 2), h - p - ((v - min) / range) * (h - p * 2)]);
  const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`).join(" ");
  return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" /><circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={3} fill={color} /></svg>;
}
function LoginPage({ onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const login = () => {
    if (id === "admin" && pw === "vogue2026") onLogin();
    else setErr("아이디 또는 비밀번호가 올바르지 않습니다.");
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: T.gold, fontWeight: 700, marginBottom: 8 }}>{SHOP_NAME_EN}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, marginBottom: 4 }}>{SHOP_NAME}</h1>
          <p style={{ fontSize: 12, color: T.muted }}>헤어케어 헬스 플랫폼</p>
        </div>
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 20 }}>스타일리스트 로그인</h2>
          <Input label="아이디" value={id} onChange={setId} placeholder="admin" style={{ marginBottom: 12 }} />
          <Input label="비밀번호" value={pw} onChange={setPw} placeholder="••••••••" type="password" style={{ marginBottom: 6 }} />
          {err && <p style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>⚠ {err}</p>}
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>테스트: admin / vogue2026</p>
          <Btn variant="gold" size="lg" onClick={login} style={{ width: "100%" }}>로그인</Btn>
        </Card>
      </div>
    </div>
  );
}
function CustomerList({ customers, onSelect, onAdd }) {
  const [search, setSearch] = useState("");
  const filtered = customers.filter(c => c.name.includes(search) || c.phone.includes(search));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text }}>고객 관리</h2>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>총 {customers.length}명</p>
        </div>
        <Btn variant="gold" onClick={onAdd}>+ 신규 고객 등록</Btn>
      </div>
      <Input value={search} onChange={setSearch} placeholder="이름 또는 전화번호 검색..." style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(c => {
          const latest = c.visits[c.visits.length - 1];
          return (
            <div key={c.id} onClick={() => onSelect(c)}
              style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: T.goldBg, border: `2px solid ${T.goldLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{c.age}세</span>
                  {latest && <ScoreChip score={latest.score} />}
                </div>
                <p style={{ fontSize: 12, color: T.muted }}>{c.phone} · {c.stylist} · {c.visits.length}회 방문</p>
              </div>
              <Spark values={c.visits.map(v => v.score)} color={T.gold} />
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: T.muted }}>최근 방문</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{latest?.date}</p>
              </div>
              <span style={{ color: T.muted, fontSize: 16 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function AddCustomer({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: "", phone: "", age: "", stylist: STYLISTS[0], memo: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.name || !form.phone) return alert("이름과 전화번호는 필수입니다.");
    onSave({ id: Date.now(), ...form, age: Number(form.age) || 0, joinDate: new Date().toISOString().slice(0, 10), visits: [] });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={onCancel}>← 뒤로</Btn>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text }}>신규 고객 등록</h2>
      </div>
      <Card style={{ maxWidth: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="이름 *" value={form.name} onChange={v => set("name", v)} placeholder="홍길동" />
          <Input label="전화번호 *" value={form.phone} onChange={v => set("phone", v)} placeholder="010-0000-0000" />
          <Input label="나이" value={form.age} onChange={v => set("age", v)} placeholder="30" type="number" />
          <div>
            <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>담당 스타일리스트</label>
            <select value={form.stylist} onChange={e => set("stylist", e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", background: T.white }}>
              {STYLISTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>메모</label>
          <textarea value={form.memo} onChange={e => set("memo", e.target.value)} placeholder="알러지, 선호사항..."
            style={{ width: "100%", height: 70, padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>취소</Btn>
          <Btn variant="gold" onClick={save} style={{ flex: 2 }}>✓ 등록 완료</Btn>
        </div>
      </Card>
    </div>
  );
}
function ScalpTab({ customer }) {
  const fileRef = useRef();
  const [phase, setPhase] = useState("idle");
  const [imgSrc, setImgSrc] = useState(null);
  const [report, setReport] = useState("");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target.result); setPhase("preview"); };
    reader.readAsDataURL(file);
  };
  const analyze = async () => {
    setPhase("analyzing"); setReport(""); setDone(false);
    let p = 0;
    const iv = setInterval(() => { p += Math.random() * 9; if (p >= 90) clearInterval(iv); setProgress(Math.min(p, 90)); }, 200);
    const base64 = imgSrc.split(",")[1];
    const mediaType = imgSrc.split(";")[0].split(":")[1];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000, stream: true,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `두피 전문 AI입니다. 이미지를 보고 한국어로 진단해주세요.\n고객: ${customer.name}님 (${customer.age}세)\n\n**🔬 두피 타입** (판정+근거)\n**📊 주요 지표** (모공청결도/수분도/피지분비/모낭건강도/염증 각 점수)\n**🚨 주의 소견** (2~3개)\n**💆 오늘 추천 시술** (2가지)\n**🌿 홈케어 루틴** (아침·저녁 각 2단계)\n**📈 개선 예상**` }
          ]}],
        }),
      });
      clearInterval(iv); setProgress(93);
      const reader2 = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: sd, value } = await reader2.read();
        if (sd) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const j = JSON.parse(line.slice(6).trim());
            if (j.type === "content_block_delta" && j.delta?.text) setReport(p => p + j.delta.text);
          } catch {}
        }
      }
      setProgress(100); setPhase("done"); setDone(true);
    } catch { setReport("⚠️ 오류가 발생했습니다."); setPhase("done"); setDone(true); }
  };
  const renderMd = t => t.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${T.gold}">$1</strong>`);
    return <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: T.sub, margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>📸 두피 사진 업로드</h3>
        {phase === "idle" && (
          <div onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: "48px 20px", textAlign: "center", cursor: "pointer", background: T.bg }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔬</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>클릭하여 사진 선택</p>
            <p style={{ fontSize: 12, color: T.muted }}>JPG, PNG · 정수리 또는 측두부 권장</p>
          </div>
        )}
        {imgSrc && (
          <div>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
              <img src={imgSrc} alt="두피" style={{ width: "100%", height: 200, objectFit: "cover" }} />
              {phase === "analyzing" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(250,249,247,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>AI 분석 중...</p>
                  <div style={{ width: "60%", height: 4, background: T.bgDark, borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: T.gold, borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.muted }}>{Math.round(progress)}%</p>
                </div>
              )}
              {phase === "done" && <div style={{ position: "absolute", top: 8, right: 8, background: T.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>✓ 분석 완료</div>}
            </div>
            {phase === "preview" && <Btn variant="gold" onClick={analyze} style={{ width: "100%" }}>🔬 AI 분석 시작</Btn>}
            {phase === "done" && <Btn variant="ghost" onClick={() => { setPhase("idle"); setImgSrc(null); setReport(""); }} style={{ width: "100%" }}>🔄 다시 촬영</Btn>}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </Card>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>📋 AI 진단 리포트</h3>
        {!report && <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}><div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>🤖</div><p style={{ fontSize: 13 }}>사진을 업로드하면 리포트가 생성됩니다</p></div>}
        {report && <div style={{ maxHeight: 380, overflowY: "auto" }}>{renderMd(report)}{!done && <span style={{ color: T.gold }}>▋</span>}</div>}
      </Card>
    </div>
  );
}
function HistoryTab({ customer, onAddVisit }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), service: "", sleep: 50, stress: 50, moisture: 50, elasticity: 50, note: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const computeScore = f => Math.round((Number(f.sleep)*0.2 + (100-Number(f.stress))*0.2 + Number(f.moisture)*0.3 + Number(f.elasticity)*0.3));
  const save = () => {
    onAddVisit({ ...form, sleep: Number(form.sleep), stress: Number(form.stress), moisture: Number(form.moisture), elasticity: Number(form.elasticity), score: computeScore(form) });
    setShowForm(false);
  };
  const meta = { sleep: { label: "수면 품질", color: T.blue }, stress: { label: "스트레스", color: T.red }, moisture: { label: "두피 수분", color: T.gold }, elasticity: { label: "모발 탄력", color: T.green }, score: { label: "종합 점수", color: T.accent } };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text }}>📅 방문 기록 ({customer.visits.length}회)</h3>
        <Btn variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "✕ 닫기" : "+ 방문 기록 추가"}</Btn>
      </div>
      {showForm && (
        <Card style={{ marginBottom: 16, background: T.goldBg }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>새 방문 기록</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Input label="방문일" value={form.date} onChange={v => set("date", v)} type="date" />
            <Input label="시술 내용" value={form.service} onChange={v => set("service", v)} placeholder="두피 스케일링 등" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {["sleep","stress","moisture","elasticity"].map(k => (
              <div key={k}>
                <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{meta[k].label}</span><span style={{ color: meta[k].color }}>{form[k]}</span>
                </label>
                <input type="range" min={0} max={100} value={form[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", accentColor: meta[k].color }} />
              </div>
            ))}
          </div>
          <textarea value={form.note} onChange={e => set("note", e.target.value)} placeholder="오늘 상태, 특이사항..."
            style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: T.sub }}>예상 점수: <strong style={{ color: T.gold, fontSize: 16 }}>{computeScore(form)}점</strong></p>
            <Btn variant="gold" onClick={save}>저장</Btn>
          </div>
        </Card>
      )}
      {customer.visits.length >= 2 && (
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>📊 지표 트렌드</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
            {["score","sleep","stress","moisture","elasticity"].map(k => {
              const vals = customer.visits.map(v => v[k]);
              const last = vals[vals.length-1];
              const prev = vals[vals.length-2];
              const d = prev !== undefined ? last - prev : null;
              return (
                <div key={k} style={{ background: T.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <Spark values={vals} color={meta[k].color} />
                  <p style={{ fontSize: 18, fontWeight: 800, color: meta[k].color, marginTop: 4 }}>{last}</p>
                  {d !== null && <p style={{ fontSize: 10, color: d >= 0 ? T.green : T.red }}>{d >= 0 ? "▲" : "▼"}{Math.abs(d)}</p>}
                  <p style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{meta[k].label}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {[...customer.visits].reverse().map((v, i) => (
          <Card key={i} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{v.date}</span>
                {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: T.goldBg, color: T.gold, border: `1px solid ${T.goldLight}`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>최근</span>}
                <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{v.service}</p>
              </div>
              <ScoreChip score={v.score} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: v.note ? 10 : 0 }}>
              {["sleep","stress","moisture","elasticity"].map(k => (
                <div key={k}>
                  <p style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{meta[k].label}</p>
                  <Bar value={v[k]} color={meta[k].color} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: meta[k].color, marginTop: 2 }}>{v[k]}</p>
                </div>
              ))}
            </div>
            {v.note && <p style={{ fontSize: 12, color: T.sub, background: T.bg, padding: "8px 12px", borderRadius: 8 }}>📝 {v.note}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
function KakaoTab({ customer }) {
  const [msgType, setMsgType] = useState("full");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const latest = customer.visits[customer.visits.length - 1];
  const TYPES = [{ id: "full", label: "📊 종합 리포트" }, { id: "simple", label: "💬 간단 감사" }, { id: "product", label: "🧴 제품 추천" }];
  const generate = async () => {
    if (!latest) return alert("방문 기록을 먼저 추가해주세요.");
    setGenerating(true); setMsg(""); setSent(false); setGenDone(false);
    const prompts = {
      full: `헤어샵 방문 고객 카카오톡 메시지. 친근하고 따뜻한 톤, 이모지 사용, 500자 이내, 마케팅 느낌 없이.\n헤어샵: ${SHOP_NAME} / 고객: ${customer.name}님 / 담당: ${customer.stylist} / 방문일: ${latest.date} / 종합점수: ${latest.score}/100 / 수면: ${latest.sleep} / 스트레스: ${latest.stress} / 두피수분: ${latest.moisture} / 탄력: ${latest.elasticity} / 시술: ${latest.service}${note ? ` / 메모: ${note}` : ""}\n형식: 인사+방문감사 → 케어지수 안내 → 핵심팁 1~2가지 → 자연스러운 다음방문 권유 → 마무리`,
      simple: `카카오톡 감사 메시지 200자 이내. ${SHOP_NAME} / ${customer.name}님 / ${latest.score}점 / 홈케어팁 1가지 / 이모지 2~3개 / 친근한 톤`,
      product: `두피 상태 기반 제품 추천 카카오톡. 300자 이내. 강매 없이 자연스럽게.\n${customer.name}님 / 수분${latest.moisture} / 탄력${latest.elasticity} / ${SHOP_NAME} / 제품 카테고리 2~3가지 + 성분 키워드`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, stream: true, messages: [{ role: "user", content: prompts[msgType] }] }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { const j = JSON.parse(line.slice(6).trim()); if (j.type === "content_block_delta" && j.delta?.text) setMsg(p => p + j.delta.text); } catch {}
        }
      }
      setGenDone(true);
    } catch { setMsg("⚠️ 오류가 발생했습니다."); setGenDone(true); }
    setGenerating(false);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}>💬 카카오톡 발송</h3>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>카카오 알림톡으로 리포트를 전송합니다</p>
        <div style={{ background: T.goldBg, border: `1px solid ${T.goldLight}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{customer.name}</p><p style={{ fontSize: 12, color: T.muted }}>{customer.phone}</p></div>
            {latest && <ScoreChip score={latest.score} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setMsgType(t.id)} style={{ flex: 1, padding: "9px 6px", border: `1px solid ${msgType === t.id ? T.gold : T.border}`, borderRadius: 9, background: msgType === t.id ? T.goldBg : T.white, color: msgType === t.id ? T.gold : T.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.label}</button>
          ))}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="스타일리스트 메모 (선택)..."
          style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <Btn variant="primary" onClick={generate} disabled={generating} style={{ width: "100%", marginBottom: 10 }}>
          {generating ? "⚙️ 생성 중..." : "✨ AI 메시지 생성"}
        </Btn>
        {genDone && !sent && <Btn variant="kakao" onClick={() => setSent(true)} style={{ width: "100%" }}>📨 카카오톡 발송</Btn>}
        {sent && (
          <div style={{ background: "#edf7f1", border: `1px solid #a8d5b5`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <p style={{ color: T.green, fontWeight: 800, fontSize: 14 }}>✅ 발송 완료!</p>
            <p style={{ color: T.sub, fontSize: 12, marginTop: 3 }}>{customer.name}님({customer.phone})께 전송됨</p>
          </div>
        )}
      </Card>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>📱 미리보기</h3>
        <div style={{ maxWidth: 280, margin: "0 auto", background: "#b2c7d8", borderRadius: 20, overflow: "hidden", border: "5px solid #1a1a1a" }}>
          <div style={{ background: "#FEE500", padding: "9px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#3a1d00" }}>카카오톡</span>
            <span style={{ fontSize: 11, color: "#3a1d00" }}>11:32</span>
          </div>
          <div style={{ background: "#3a1d00", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.kakao, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✂</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.kakao }}>{SHOP_NAME}</span>
          </div>
          <div style={{ padding: "14px 10px", minHeight: 220 }}>
            {!msg && !generating && <p style={{ textAlign: "center", color: "#666", fontSize: 12, paddingTop: 40 }}>메시지를 생성해주세요</p>}
            {generating && !msg && <p style={{ textAlign: "center", color: "#555", fontSize: 12, paddingTop: 40 }}>⚙️ 생성 중...</p>}
            {msg && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.kakao, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✂</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{SHOP_NAME}</span>
                </div>
                <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, color: "#1a1a1a", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{msg}{!genDone && <span style={{ color: T.gold }}>▋</span>}</p>
                </div>
                {genDone && <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>오전 11:32 · 읽음</p>}
              </div>
            )}
          </div>
          <div style={{ background: "#fff", padding: "7px 10px", display: "flex", gap: 6 }}>
            <div style={{ flex: 1, height: 26, background: "#f5f5f5", borderRadius: 13, fontSize: 11, color: "#aaa", padding: "0 10px", display: "flex", alignItems: "center" }}>메시지 입력</div>
            <div style={{ width: 26, height: 26, background: T.kakao, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>▶</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
function CustomerDetail({ customer, onBack, onUpdateCustomer }) {
  const [tab, setTab] = useState("scalp");
  const TABS = [{ id: "scalp", label: "🔬 두피 분석" }, { id: "history", label: "📅 방문 히스토리" }, { id: "kakao", label: "💬 카카오 발송" }];
  const addVisit = (visit) => onUpdateCustomer({ ...customer, visits: [...customer.visits, visit] });
  const latest = customer.visits[customer.visits.length - 1];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← 목록</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{customer.name}</h2>
            <span style={{ fontSize: 12, color: T.muted }}>{customer.age}세 · {customer.phone}</span>
            {latest && <ScoreChip score={latest.score} />}
          </div>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>담당: {customer.stylist} · 등록일: {customer.joinDate} · 총 {customer.visits.length}회 방문{customer.memo && ` · 📝 ${customer.memo}`}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: T.bgDark, padding: 5, borderRadius: 12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: tab === t.id ? T.white : "transparent", color: tab === t.id ? T.text : T.muted, transition: "all 0.18s" }}>{t.label}</button>
        ))}
      </div>
      {tab === "scalp" && <ScalpTab customer={customer} />}
      {tab === "history" && <HistoryTab customer={customer} onAddVisit={addVisit} />}
      {tab === "kakao" && <KakaoTab customer={customer} />}
    </div>
  );
}
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("list");
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [selected, setSelected] = useState(null);
  const updateCustomer = (updated) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  };
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Noto Sans KR', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e8e2d9; border-radius: 99px; }
        input[type=range] { height: 4px; }
      `}</style>
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: T.text }}>{SHOP_NAME}</p>
              <p style={{ fontSize: 10, color: T.muted }}>HAIRCARE HEALTH PLATFORM</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: T.muted }}>스타일리스트 모드</span>
            <Btn variant="ghost" size="sm" onClick={() => setLoggedIn(false)}>로그아웃</Btn>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 60px" }}>
        {page === "list" && <CustomerList customers={customers} onSelect={c => { setSelected(c); setPage("detail"); }} onAdd={() => setPage("add")} />}
        {page === "add" && <AddCustomer onSave={c => { setCustomers(p => [...p, c]); setPage("list"); }} onCancel={() => setPage("list")} />}
        {page === "detail" && selected && <CustomerDetail customer={customers.find(c => c.id === selected.id) || selected} onBack={() => setPage("list")} onUpdateCustomer={updateCustomer} />}
      </div>
    </div>
  );
}
