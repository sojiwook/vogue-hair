import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SHOP = { name: "보그헤어위시티점", en: "VOGUE HAIR WISHCITY" };
const STYLISTS = ["이서", "승미", "우기"];
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  bg: "#f8f6f2", card: "#fff", border: "#ede8e0",
  gold: "#b8965a", goldBg: "#fdf8f0", goldLight: "#d4b07a",
  text: "#1a1a1a", sub: "#666", muted: "#999",
  red: "#d94f4f", green: "#3a8c5c", blue: "#3a6fa8",
  kakao: "#FEE500",
};

async function callAI(prompt, imgBase64, imgType, onChunk, label, customerName, customerAge) {
  const body = {
    prompt,
    image: imgBase64 ? { data: imgBase64, mimeType: imgType || "image/jpeg" } : null,
    customerInfo: { label: label || "두피", name: customerName || "고객", age: customerAge || 0 },
  };
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API 오류: ${res.status}`);
  }
  const data = await res.json();
  onChunk(data.result || "");
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, full, style = {} }) {
  const sz = size === "sm" ? { fontSize: 12, padding: "7px 14px" } : size === "lg" ? { fontSize: 15, padding: "14px 28px" } : { fontSize: 13, padding: "10px 20px" };
  const vr = variant === "gold" ? { background: C.gold, color: "#fff", boxShadow: "0 4px 16px rgba(184,150,90,0.3)" } : variant === "kakao" ? { background: C.kakao, color: "#3a1d00" } : variant === "ghost" ? { background: "transparent", color: C.sub, border: `1px solid ${C.border}` } : variant === "outline" ? { background: "#fff", color: C.gold, border: `1px solid ${C.gold}` } : { background: C.text, color: "#fff" };
  return <button onClick={onClick} disabled={disabled} style={{ ...sz, ...vr, border: vr.border || "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: full ? "100%" : "auto", transition: "all 0.18s", ...style }}>{children}</button>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, ...style }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, type = "text", style = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={style}>
      {label && <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${focus ? C.gold : C.border}`, borderRadius: 9, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} />
    </div>
  );
}

function Chip({ score }) {
  const color = score >= 70 ? C.green : score >= 50 ? "#b07800" : C.red;
  const bg = score >= 70 ? "#edf7f1" : score >= 50 ? "#fff8e6" : "#fff0f0";
  return <span style={{ fontSize: 12, fontWeight: 800, color, background: bg, padding: "3px 10px", borderRadius: 99 }}>{score}점</span>;
}

function Bar({ value, color }) {
  return <div style={{ height: 5, background: "#f0ece4", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(value || 0, 100)}%`, background: color, borderRadius: 99 }} /></div>;
}

function Spark({ values, color }) {
  if (!values || values.length < 2) return null;
  const w = 80, h = 28, p = 3;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const pts = values.map((v, i) => [p + (i / (values.length - 1)) * (w - p * 2), h - p - ((v - min) / range) * (h - p * 2)]);
  const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`).join(" ");
  return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" /><circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={color} /></svg>;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !pw) return setErr("이메일과 비밀번호를 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) { setErr("이메일 또는 비밀번호가 틀렸습니다."); return; }
    onLogin();
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      backgroundImage: "radial-gradient(ellipse 600px 400px at 60% 40%, #f5ede0 0%, transparent 70%)",
    }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>✦</div>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: C.gold, fontWeight: 700, marginBottom: 6 }}>{SHOP.en}</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4 }}>{SHOP.name}</h1>
          <p style={{ fontSize: 12, color: C.muted }}>헤어케어 헬스 플랫폼</p>
        </div>
        <Card style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>스타일리스트 로그인</h2>
          <Field label="이메일" value={email} onChange={setEmail} placeholder="이메일 입력" style={{ marginBottom: 12 }} />
          <Field label="비밀번호" value={pw} onChange={setPw} type="password" placeholder="비밀번호 입력" style={{ marginBottom: 8 }} />
          {err && <p style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>⚠ {err}</p>}
          <Btn variant="gold" size="lg" full onClick={login} disabled={loading}>
            {loading ? "로그인 중..." : "로그인 →"}
          </Btn>
        </Card>
      </div>
    </div>
  );
}
function CustomerList({ customers, onSelect, onAdd, loading }) {
  const [search, setSearch] = useState("");
  const list = Array.isArray(customers) ? customers : [];
  const filtered = list.filter(c => (c.name || "").includes(search) || (c.phone || "").includes(search));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>고객 관리</h2><p style={{ fontSize: 13, color: C.muted }}>총 {list.length}명</p></div>
        <Btn variant="gold" onClick={onAdd}>+ 신규 고객 등록</Btn>
      </div>
    
      <Field value={search} onChange={setSearch} placeholder="🔍 이름 또는 전화번호 검색..." style={{ marginBottom: 16 }} />
      {loading ? <div style={{ textAlign: "center", padding: 60, color: C.muted }}><p style={{ fontSize: 32, marginBottom: 8 }}>⏳</p><p>불러오는 중...</p></div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map(c => {
            const visits = Array.isArray(c.visits) ? c.visits : [];
            const latest = visits[visits.length - 1];
            return (
              <div key={c.id} onClick={() => onSelect(c)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.18s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = "0 4px 20px rgba(184,150,90,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.goldBg, border: `2px solid ${C.goldLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{c.age}세</span>
                    {latest && <Chip score={latest.score} />}
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>{c.phone} · {c.stylist} · {visits.length}회 방문</p>
                </div>
                <Spark values={visits.map(v => v.score)} color={C.gold} />
                <div style={{ textAlign: "right", flexShrink: 0 }}><p style={{ fontSize: 11, color: C.muted }}>최근 방문</p><p style={{ fontSize: 12, fontWeight: 700 }}>{latest?.date ?? "-"}</p></div>
                <span style={{ color: C.muted }}>›</span>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p><p>검색 결과가 없습니다</p></div>}
        </div>
      )}
    </div>
  );
}

function AddCustomer({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: "", phone: "", age: "", stylist: STYLISTS[0], memo: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = async () => {
    if (!form.name || !form.phone) return alert("이름과 전화번호는 필수입니다.");
    setSaving(true);
    const { data, error } = await supabase.from("customers").insert({ name: form.name, phone: form.phone, age: Number(form.age) || 0, stylist: form.stylist, memo: form.memo, join_date: new Date().toISOString().slice(0, 10) }).select().single();
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    onSave({ ...data, visits: [] });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}><Btn variant="ghost" size="sm" onClick={onCancel}>← 뒤로</Btn><h2 style={{ fontSize: 20, fontWeight: 900 }}>신규 고객 등록</h2></div>
      <Card style={{ maxWidth: 540 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="이름 *" value={form.name} onChange={v => set("name", v)} placeholder="홍길동" />
          <Field label="전화번호 *" value={form.phone} onChange={v => set("phone", v)} placeholder="010-0000-0000" />
          <Field label="나이" value={form.age} onChange={v => set("age", v)} type="number" placeholder="30" />
          <div>
            <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>담당 스타일리스트</label>
            <select value={form.stylist} onChange={e => set("stylist", e.target.value)} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none" }}>{STYLISTS.map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>메모</label>
          <textarea value={form.memo} onChange={e => set("memo", e.target.value)} placeholder="알러지, 선호사항..." style={{ width: "100%", height: 70, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}><Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>취소</Btn><Btn variant="gold" onClick={save} disabled={saving} style={{ flex: 2 }}>{saving ? "저장 중..." : "✓ 등록 완료"}</Btn></div>
      </Card>
    </div>
  );
}

function ScalpTab({ customer }) {
  const fileRef = useRef();
  const LABELS = ["정수리", "측두부(좌)", "측두부(우)", "후두부", "전체"];
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleFiles = e => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    Promise.all(files.map((file, i) => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve({ src: ev.target.result, label: LABELS[images.length + i] || `구역${images.length + i + 1}`, report: "", analyzing: false, done: false });
      reader.readAsDataURL(file);
    }))).then(newImgs => setImages(prev => [...prev, ...newImgs].slice(0, 5)));
  };

  const analyze = async idx => {
    const img = images[idx];
    setImages(prev => prev.map((im, i) => i === idx ? { ...im, analyzing: true, report: "", done: false } : im));
    const base64 = img.src.split(",")[1];
    const mediaType = img.src.split(";")[0].split(":")[1];
    try {
      let fullText = "";
      await callAI(`두피 전문 AI입니다. [${img.label}] 두피 이미지를 분석해주세요.\n고객: ${customer.name}님 (${customer.age}세)\n\n**🔬 두피 타입** (판정+근거 1문장)\n**📊 주요 지표**\n- 모공 청결도: XX/100\n- 두피 수분도: XX/100\n- 피지 분비량: XX/100\n- 모낭 건강도: XX/100\n- 염증·자극: XX/100\n**🚨 주의 소견** (2~3개)\n**💆 추천 케어** (2가지)\n**📈 개선 예상**\n\n각 섹션 3줄 이내, 한국어로.`, base64, mediaType, text => { fullText += text; setImages(prev => prev.map((im, i) => i === idx ? { ...im, report: fullText } : im)); }, img.label, customer.name, customer.age);
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, analyzing: false, done: true } : im));
    } catch (e) {
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, report: `⚠️ 오류: ${e.message}`, analyzing: false, done: true } : im));
    }
  };

  const renderMd = t => t.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.gold}">$1</strong>`);
    return <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: C.sub, margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><h3 style={{ fontSize: 15, fontWeight: 800 }}>📸 두피 사진 ({images.length}/5)</h3><p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>정수리·측두부·후두부 최대 5장</p></div>
          <div style={{ display: "flex", gap: 8 }}>
            {images.length < 5 && <Btn variant="outline" size="sm" onClick={() => fileRef.current.click()}>+ 사진 추가</Btn>}
            {images.length > 0 && <Btn variant="gold" size="sm" onClick={() => images.forEach((_, i) => { if (!images[i].done && !images[i].analyzing) analyze(i); })}>🔬 전체 분석</Btn>}
          </div>
        </div>
        {images.length > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{ position: "relative", width: 82, height: 82, borderRadius: 10, overflow: "hidden", border: `2px solid ${activeIdx === i ? C.gold : C.border}`, cursor: "pointer" }}>
                <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", padding: "2px 4px", textAlign: "center" }}><span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{img.label}</span></div>
                {img.done && <div style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>✓</div>}
                {img.analyzing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚙️</div>}
                <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); setActiveIdx(0); }} style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            {images.length < 5 && <div onClick={() => fileRef.current.click()} style={{ width: 82, height: 82, borderRadius: 10, border: `2px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: C.bg }}><span style={{ fontSize: 22, color: C.muted }}>+</span><span style={{ fontSize: 9, color: C.muted }}>추가</span></div>}
          </div>
        ) : (
          <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: "48px 20px", textAlign: "center", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔬</div>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>두피 사진 업로드 (최대 5장)</p>
            <p style={{ fontSize: 12, color: C.muted }}>Ctrl 누르고 클릭하면 여러 장 선택 가능</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      </Card>
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>{images[activeIdx]?.label}</h3>
              {!images[activeIdx]?.done && !images[activeIdx]?.analyzing && <Btn variant="gold" size="sm" onClick={() => analyze(activeIdx)}>🔬 분석</Btn>}
            </div>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
              <img src={images[activeIdx]?.src} alt="두피" style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
              {images[activeIdx]?.analyzing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}><p style={{ fontSize: 14, fontWeight: 700 }}>AI 분석 중...</p><div style={{ width: "60%", height: 4, background: C.border, borderRadius: 99 }}><div style={{ height: "100%", width: "70%", background: C.gold, borderRadius: 99 }} /></div></div>}
              {images[activeIdx]?.done && <div style={{ position: "absolute", top: 10, right: 10, background: C.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>✓ 완료</div>}
            </div>
          </Card>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>📋 AI 진단 리포트</h3>
            {!images[activeIdx]?.report && !images[activeIdx]?.analyzing ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}><div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>🤖</div><p style={{ fontSize: 13 }}>분석 버튼을 눌러주세요</p></div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>{renderMd(images[activeIdx]?.report || "")}{images[activeIdx]?.analyzing && <span style={{ color: C.gold }}>▋</span>}</div>
            )}
            {images.some(im => im.done) && (
              <button onClick={async () => {
                const latest = customer.visits?.[customer.visits.length - 1];
                if (!latest) return alert("먼저 방문 기록을 추가해주세요!");
                const allReports = images.filter(im => im.done && im.report).map(im => "[" + im.label + "]\n" + im.report).join("\n\n---\n\n");
                await supabase.from("visits").update({ scalp_report: allReports }).eq("id", latest.id);
                alert("✅ 두피 분석 결과가 저장됐어요!");
              }} style={{ marginTop: 12, width: "100%", padding: "10px", background: C.green, color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💾 분석 결과 저장하기</button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ customer, onAddVisit }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), service: "", sleep: 50, stress: 50, moisture: 50, elasticity: 50, note: "" });
  useEffect(() => {
  const loadSurvey = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("phone", customer.phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      const sleepMap = { "5시간 이하": 30, "5~6시간": 50, "6~7시간": 70, "7시간 이상": 85 };
const stressVal = data.stress ? data.stress * 15 : 50;
const condMap = { "나쁨": 35, "보통": 55, "좋음": 75 };
      setForm(p => ({
        ...p,
        sleep: sleepMap[data.sleep] || 50,
        stress: stressVal,
        moisture: condMap[data.condition] || 50,
      }));
    }
  };
  loadSurvey();
}, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const score = f => Math.round(Number(f.sleep) * 0.2 + (100 - Number(f.stress)) * 0.2 + Number(f.moisture) * 0.3 + Number(f.elasticity) * 0.3);
  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const meta = { sleep: { label: "수면 품질", color: C.blue }, stress: { label: "스트레스", color: C.red }, moisture: { label: "두피 수분", color: C.gold }, elasticity: { label: "모발 탄력", color: C.green }, score: { label: "종합 점수", color: C.text } };

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.from("visits").insert({ customer_id: customer.id, date: form.date, service: form.service, sleep: Number(form.sleep), stress: Number(form.stress), moisture: Number(form.moisture), elasticity: Number(form.elasticity), score: score(form), note: form.note }).select().single();
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    onAddVisit(data);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>📅 방문 기록 ({visits.length}회)</h3>
        <Btn variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "✕ 닫기" : "+ 방문 추가"}</Btn>
      </div>
      {showForm && (
        <Card style={{ marginBottom: 16, background: C.goldBg, border: `1px solid ${C.goldLight}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>새 방문 기록</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Field label="방문일" value={form.date} onChange={v => set("date", v)} type="date" />
            <Field label="시술 내용" value={form.service} onChange={v => set("service", v)} placeholder="두피 스케일링 등" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {["sleep", "stress", "moisture", "elasticity"].map(k => (
              <div key={k}>
                <label style={{ fontSize: 12, color: C.sub, fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{meta[k].label}</span><span style={{ color: meta[k].color, fontWeight: 800 }}>{form[k]}</span></label>
                <input type="range" min={0} max={100} value={form[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", accentColor: meta[k].color }} />
              </div>
            ))}
          </div>
          <textarea value={form.note} onChange={e => set("note", e.target.value)} placeholder="스타일리스트 메모..." style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: C.sub }}>예상 점수: <strong style={{ color: C.gold, fontSize: 18 }}>{score(form)}점</strong></p>
            <Btn variant="gold" size="sm" onClick={save} disabled={saving}>{saving ? "저장 중..." : "저장"}</Btn>
          </div>
        </Card>
      )}
      {visits.length >= 2 && (
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>📊 지표 트렌드</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
            {["score", "sleep", "stress", "moisture", "elasticity"].map(k => {
              const vals = visits.map(v => v[k]);
              const last = vals[vals.length - 1];
              const d = vals.length >= 2 ? last - vals[vals.length - 2] : null;
              return <div key={k} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}><Spark values={vals} color={meta[k].color} /><p style={{ fontSize: 20, fontWeight: 800, color: meta[k].color, marginTop: 4 }}>{last}</p>{d !== null && <p style={{ fontSize: 10, color: d >= 0 ? C.green : C.red }}>{d >= 0 ? "▲" : "▼"}{Math.abs(d)}</p>}<p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{meta[k].label}</p></div>;
            })}
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {[...visits].reverse().map((v, i) => (
          <Card key={i} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 800 }}>{v.date}</span>{i === 0 && <span style={{ fontSize: 10, background: C.goldBg, color: C.gold, border: `1px solid ${C.goldLight}`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>최근</span>}</div>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{v.service}</p>
              </div>
              <Chip score={v.score} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: v.note ? 10 : 0 }}>
              {["sleep", "stress", "moisture", "elasticity"].map(k => <div key={k}><p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{meta[k].label}</p><Bar value={v[k]} color={meta[k].color} /><p style={{ fontSize: 11, fontWeight: 700, color: meta[k].color, marginTop: 2 }}>{v[k]}</p></div>)}
            </div>
            {v.note && <p style={{ fontSize: 12, color: C.sub, background: C.bg, padding: "8px 12px", borderRadius: 8 }}>📝 {v.note}</p>}
            {v.scalp_report && (
              <div style={{ marginTop: 10, background: "#f8f6f2", borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.gold, marginBottom: 6 }}>🔬 두피 분석 결과</p>
                <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{v.scalp_report}</p>
              </div>
            )}
          </Card>
        ))}
        {visits.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>아직 방문 기록이 없습니다.</div>}
      </div>
    </div>
  );
}

// App.jsx 안의 KakaoTab 함수만 교체하세요
// 📨 카카오톡 발송 버튼 → 솔라피 알림톡 실제 발송

function KakaoTab({ customer, kakaoMsg, setKakaoMsg }) {
  const [msgType, setMsgType] = useState("full");
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);   // ← 추가
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [sendError, setSendError] = useState("");  // ← 추가

  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const latest = visits[visits.length - 1];

  useEffect(() => {
    if (latest?.kakao_message && !kakaoMsg) {
      setKakaoMsg(latest.kakao_message);
      setDone(true);
    }
  }, []);

  const TYPES = [
    { id: "full", label: "📊 종합 리포트" },
    { id: "simple", label: "💬 간단 감사" },
    { id: "product", label: "🧴 제품 추천" },
  ];

  const PROMPTS = {
    full: `헤어샵 방문 고객 카카오톡 메시지. 친근하고 따뜻한 톤, 이모지, 500자 이내, 마케팅 느낌 없이.\n헤어샵: ${SHOP.name} / 고객: ${customer.name}님 / 담당: ${customer.stylist} / 방문일: ${latest?.date} / 종합점수: ${latest?.score}/100 / 수면: ${latest?.sleep} / 스트레스: ${latest?.stress} / 두피수분: ${latest?.moisture} / 탄력: ${latest?.elasticity} / 시술: ${latest?.service}${note ? ` / 메모: ${note}` : ""}${latest?.scalp_report ? `\n\n두피 분석 결과:\n${latest.scalp_report.slice(0, 500)}` : ""}\n형식: 인사+방문감사 → 두피분석 결과 핵심 요약 → 맞춤 케어팁 1~2가지 → 자연스러운 다음방문 권유 → 마무리`,
    simple: `카카오톡 감사 메시지 200자 이내. ${SHOP.name} / ${customer.name}님 / ${latest?.score}점 / 홈케어팁 1가지 / 이모지 2~3개`,
    product: `두피 상태 기반 제품 추천 카카오톡. 300자 이내. 강매 없이.\n${customer.name}님 / 수분${latest?.moisture} / 탄력${latest?.elasticity} / 제품 카테고리 2~3가지 + 성분 키워드`,
  };

  const generate = async () => {
    if (!latest) return alert("방문 기록을 먼저 추가해주세요.");
    setGenerating(true);
    setKakaoMsg("");
    setSent(false);
    setSendError("");
    setDone(false);
    try {
      let fullMsg = "";
      await callAI(
        PROMPTS[msgType], null, null,
        text => { fullMsg += text; setKakaoMsg(fullMsg); },
        "카카오", customer.name, customer.age
      );
      setDone(true);
      await supabase.from("visits").update({ kakao_message: fullMsg }).eq("id", latest.id);
    } catch (e) {
      setKakaoMsg(`⚠️ 오류: ${e.message}`);
      setDone(true);
    }
    setGenerating(false);
  };

  // ─── 솔라피 알림톡 발송 ───────────────────────────────────────────
  const sendAlimtalk = async () => {
    if (!latest) return alert("방문 기록이 없습니다.");
    if (!customer.phone) return alert("고객 전화번호가 없습니다.");

    setSending(true);
    setSendError("");

    const reportUrl = `${window.location.origin}/report?phone=${encodeURIComponent(customer.phone)}`;

    try {
      const res = await fetch("/api/sendAlimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          phone: customer.phone,
          sleep: latest.sleep,
          stress: latest.stress,
          moisture: latest.moisture,
          elasticity: latest.elasticity,
          score: latest.score,
          stylist: customer.stylist,
          reportUrl,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSent(true);
        // 발송 기록 visits 테이블에 저장
        await supabase
          .from("visits")
          .update({ kakao_message: kakaoMsg })
          .eq("id", latest.id);
      } else {
        setSendError(result.error || "알림톡 발송에 실패했습니다.");
      }
    } catch (e) {
      setSendError("네트워크 오류: " + e.message);
    }

    setSending(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* 왼쪽: 컨트롤 */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>💬 카카오톡 발송</h3>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>AI가 고객 데이터 기반으로 메시지를 생성합니다</p>

        <div style={{ background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800 }}>{customer.name}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{customer.phone}</p>
            </div>
            {latest && <Chip score={latest.score} />}
          </div>
        </div>

        {/* 메시지 타입 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setMsgType(t.id)} style={{
              flex: 1, padding: "9px 6px",
              border: `1px solid ${msgType === t.id ? C.gold : C.border}`,
              borderRadius: 9,
              background: msgType === t.id ? C.goldBg : "#fff",
              color: msgType === t.id ? C.gold : C.muted,
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>

        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="스타일리스트 메모 (선택)..."
          style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
        />

        {/* AI 생성 버튼 */}
        <Btn variant="primary" onClick={generate} disabled={generating} full style={{ marginBottom: 10 }}>
          {generating ? "⚙️ 생성 중..." : "✨ AI 메시지 생성"}
        </Btn>

        {/* 솔라피 발송 버튼 — 메시지 생성 완료 후 표시 */}
        {kakaoMsg && !sent && (
          <Btn
            variant="kakao"
            onClick={sendAlimtalk}
            disabled={sending}
            full
          >
            {sending ? "📤 발송 중..." : "📨 카카오 알림톡 발송"}
          </Btn>
        )}

        {/* 오류 */}
        {sendError && (
          <div style={{ marginTop: 10, background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>⚠️ 발송 실패</p>
            <p style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{sendError}</p>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>솔라피 환경변수 또는 템플릿 검수 상태를 확인해주세요.</p>
          </div>
        )}

        {/* 발송 완료 */}
        {sent && (
          <div style={{ marginTop: 10, background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <p style={{ color: C.green, fontWeight: 800 }}>✅ 알림톡 발송 완료!</p>
            <p style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{customer.name}님 ({customer.phone}) 전송됨</p>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>리포트 링크가 카카오톡으로 발송됐습니다</p>
          </div>
        )}
      </Card>

      {/* 오른쪽: 미리보기 (기존과 동일) */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>📱 미리보기</h3>
        <div style={{ maxWidth: 280, margin: "0 auto", background: "#b2c7d8", borderRadius: 20, overflow: "hidden", border: "5px solid #1a1a1a", boxShadow: "0 16px 40px rgba(0,0,0,0.15)" }}>
          <div style={{ background: "#FEE500", padding: "9px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#3a1d00" }}>카카오톡</span>
            <span style={{ fontSize: 11, color: "#3a1d00" }}>11:32</span>
          </div>
          <div style={{ background: "#3a1d00", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.kakao, display: "flex", alignItems: "center", justifyContent: "center" }}>✂</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.kakao }}>{SHOP.name}</span>
          </div>
          <div style={{ padding: "14px 10px", minHeight: 220 }}>
            {!kakaoMsg && !generating && <p style={{ textAlign: "center", color: "#666", fontSize: 12, paddingTop: 40 }}>메시지를 생성해주세요</p>}
            {generating && !kakaoMsg && <p style={{ textAlign: "center", color: "#555", fontSize: 12, paddingTop: 40 }}>⚙️ 생성 중...</p>}
            {kakaoMsg && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.kakao, display: "flex", alignItems: "center", justifyContent: "center" }}>✂</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{SHOP.name}</span>
                </div>
                <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, color: "#1a1a1a", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {kakaoMsg}{!done && <span style={{ color: C.gold }}>▋</span>}
                  </p>
                </div>
                {done && <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>오전 11:32 · 읽음</p>}
              </div>
            )}
          </div>
          <div style={{ background: "#fff", padding: "7px 10px", display: "flex", gap: 6 }}>
            <div style={{ flex: 1, height: 26, background: "#f5f5f5", borderRadius: 13, fontSize: 11, color: "#aaa", padding: "0 10px", display: "flex", alignItems: "center" }}>메시지 입력</div>
            <div style={{ width: 26, height: 26, background: C.kakao, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>▶</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CustomerDetail({ customer, onBack, onUpdate, onDeleteCustomer }) {
  const [tab, setTab] = useState("scalp");
  const [kakaoMsg, setKakaoMsg] = useState("");
  const TABS = [{ id: "scalp", label: "🔬 두피 분석" }, { id: "history", label: "📅 방문 히스토리" }, { id: "kakao", label: "💬 카카오 발송" }];
  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const latest = visits[visits.length - 1];
  const deleteCustomer = async () => {
  if (!window.confirm(`${customer.name}님을 삭제할까요? 방문 기록도 모두 삭제됩니다.`)) return;
  await supabase.from("visits").delete().eq("customer_id", customer.id);
  await supabase.from("customers").delete().eq("id", customer.id);
  onDeleteCustomer(customer.id);
};

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← 목록</Btn>
        <Btn variant="ghost" size="sm" onClick={deleteCustomer} style={{ color: "#d94f4f", borderColor: "#d94f4f" }}>🗑 삭제</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>{customer.name}</h2>
            <span style={{ fontSize: 12, color: C.muted }}>{customer.age}세 · {customer.phone}</span>
            {latest && <Chip score={latest.score} />}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>담당: {customer.stylist} · 등록일: {customer.join_date} · 총 {visits.length}회 방문{customer.memo && ` · 📝 ${customer.memo}`}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f0ece4", padding: 5, borderRadius: 12 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: 10, border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? C.text : C.muted, boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.18s" }}>{t.label}</button>)}
      </div>
      <div style={{ display: tab === "scalp" ? "block" : "none" }}><ScalpTab customer={customer} /></div>
      <div style={{ display: tab === "history" ? "block" : "none" }}><HistoryTab customer={customer} onAddVisit={v => onUpdate({ ...customer, visits: [...visits, v] })} /></div>
      <div style={{ display: tab === "kakao" ? "block" : "none" }}><KakaoTab customer={customer} kakaoMsg={kakaoMsg} setKakaoMsg={setKakaoMsg} /></div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("list");
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      const { data: vData } = await supabase.from("visits").select("*").order("date", { ascending: true });
      const merged = (cData || []).map(c => ({ ...c, visits: (vData || []).filter(v => v.customer_id === c.id) }));
      setCustomers(merged);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  const updateCustomer = updated => { setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelected(updated); };

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans KR', 'DM Sans', sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=Noto+Sans+KR:wght@400;700;800;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }::-webkit-scrollbar { width: 5px; }::-webkit-scrollbar-thumb { background: #e0d8cc; border-radius: 99px; }input[type=range] { height: 4px; }`}</style>
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✦</div>
            <div><p style={{ fontSize: 13, fontWeight: 900 }}>{SHOP.name}</p><p style={{ fontSize: 9, color: C.muted, letterSpacing: "0.08em" }}>HAIRCARE HEALTH PLATFORM</p></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} /><span style={{ fontSize: 12, color: C.muted }}>DB 연결됨</span><Btn variant="ghost" size="sm" onClick={() => setLoggedIn(false)}>로그아웃</Btn></div>
        </div>
      </div>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 60px" }}>
        {page === "list" && <CustomerList customers={customers} onSelect={c => { setSelected(c); setPage("detail"); }} onAdd={() => setPage("add")} loading={loading} />}
        {page === "add" && <AddCustomer onSave={c => { setCustomers(p => [c, ...p]); setPage("list"); }} onCancel={() => setPage("list")} />}
    {page === "detail" && selected && customers.find(c => c.id === selected.id) && <CustomerDetail customer={customers.find(c => c.id === selected.id)} onBack={() => setPage("list")} onUpdate={updateCustomer} onDeleteCustomer={id => { setCustomers(prev => prev.filter(c => c.id !== id)); setPage("list"); }} />}
      </div>
    </div>
  );
}
