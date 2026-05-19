import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SHOP = { name: "소감", en: "SOGAM" };
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

async function callAI(prompt, imgBase64, imgType, onChunk, label, customerName, customerAge, fullCustomerInfo) {
  const body = {
    prompt,
    image: imgBase64 ? { data: imgBase64, mimeType: imgType || "image/jpeg" } : null,
    customerInfo: fullCustomerInfo || { label: label || "두피", name: customerName || "고객", age: customerAge || 0 },
  };
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // res.json() 직접 호출 시 빈 body나 HTML 에러 페이지면 "Unexpected end of JSON input" 발생
  // text()로 먼저 읽고 JSON 파싱을 별도로 처리
  const raw = await res.text();

  if (!res.ok) {
    let errMsg = `API 오류: ${res.status}`;
    try { errMsg = JSON.parse(raw)?.error || errMsg; } catch {}
    throw new Error(errMsg);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`서버 응답을 파싱할 수 없습니다 (${res.status})`);
  }

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
  const [sort, setSort] = useState("recent");
  const list = Array.isArray(customers) ? customers : [];
  const filtered = list.filter(c => (c.name || "").includes(search) || (c.phone || "").includes(search));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return (a.name || "").localeCompare(b.name || "", "ko");
    if (sort === "joined") return (b.created_at || "").localeCompare(a.created_at || "");
    // recent: 최신 방문일 내림차순, 방문 없는 고객은 하단
    const aV = Array.isArray(a.visits) ? a.visits : [];
    const bV = Array.isArray(b.visits) ? b.visits : [];
    const aD = aV.length ? (aV[aV.length - 1].date || "") : "";
    const bD = bV.length ? (bV[bV.length - 1].date || "") : "";
    if (!aD && !bD) return 0;
    if (!aD) return 1;
    if (!bD) return -1;
    return bD.localeCompare(aD);
  });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>고객 관리</h2><p style={{ fontSize: 13, color: C.muted }}>총 {list.length}명</p></div>
        <Btn variant="gold" onClick={onAdd}>+ 신규 고객 등록</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <Field value={search} onChange={setSearch} placeholder="🔍 이름 또는 전화번호 검색..." style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[{ key: "recent", label: "최근방문" }, { key: "name", label: "이름순" }, { key: "joined", label: "등록순" }].map(opt => (
            <button key={opt.key} onClick={() => setSort(opt.key)} style={{ padding: "9px 10px", fontSize: 11, fontWeight: sort === opt.key ? 800 : 500, background: sort === opt.key ? C.gold : "#fff", color: sort === opt.key ? "#fff" : C.sub, border: `1px solid ${sort === opt.key ? C.gold : C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.18s" }}>{opt.label}</button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 60, color: C.muted }}><p style={{ fontSize: 32, marginBottom: 8 }}>⏳</p><p>불러오는 중...</p></div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map(c => {
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
          {sorted.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p><p>검색 결과가 없습니다</p></div>}
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

function parseScalpReport(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'object' ? raw : JSON.parse(raw);
  } catch {
    return { aiAnalysis: String(raw) };
  }
}

function renderMd(t) {
  if (!t) return null;
  return String(t).split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') return null;
    if (/^##\s*두피\s*분석\s*[-–]/.test(trimmed)) return null;
    if (/^분석\s*부위\s*:/.test(trimmed)) return null;
    const locMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (locMatch) {
      return <p key={i} style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginTop: 10, marginBottom: 4 }}>📍 {locMatch[1]}</p>;
    }
    const headerMatch = trimmed.match(/^#{1,3}\s+(.*)/);
    if (headerMatch) {
      const headerText = headerMatch[1].trim();
      if (!headerText) return null;
      return <p key={i} style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginTop: i > 0 ? 10 : 0, marginBottom: 4 }}>{headerText}</p>;
    }
    const html = trimmed.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.gold}">$1</strong>`);
    return <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: C.sub, margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

function ScalpReportView({ report, analyzing }) {
  if (!report && !analyzing) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>🤖</div>
        <p style={{ fontSize: 13 }}>분석 버튼을 눌러주세요</p>
      </div>
    );
  }
  const parsed = report ? parseScalpReport(report) : null;
  const isJson = parsed && (parsed.scalpType !== undefined || parsed.moisture !== undefined || parsed.aiAnalysis !== undefined);
  return (
    <div style={{ maxHeight: 280, overflowY: "auto" }}>
      {isJson ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {parsed.scalpType && (
            <div>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>두피 타입</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{parsed.scalpType}</p>
            </div>
          )}
          {parsed.moisture !== undefined && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.sub }}>수분도</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.blue }}>{parsed.moisture}</span>
              </div>
              <Bar value={parsed.moisture} color={C.blue} />
            </div>
          )}
          {parsed.elasticity !== undefined && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.sub }}>탄력도</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{parsed.elasticity}</span>
              </div>
              <Bar value={parsed.elasticity} color={C.green} />
            </div>
          )}
          {parsed.concerns?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>주의 소견</p>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {parsed.concerns.map((c, i) => (
                  <li key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.aiAnalysis && (
            <div>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>상세 분석</p>
              {renderMd(parsed.aiAnalysis)}
            </div>
          )}
        </div>
      ) : (
        renderMd(report || "")
      )}
      {analyzing && <span style={{ color: C.gold }}>▋</span>}
    </div>
  );
}

async function convertToJpeg(file) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1920;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function ScalpTab({ customer, onUpdate }) {
  const fileRef = useRef();
  const LABELS = ["정수리", "측두부(좌)", "측두부(우)", "후두부", "전체"];
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleFiles = async e => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    const converted = await Promise.all(files.map(f => convertToJpeg(f)));
    const newImgs = await Promise.all(converted.map((file, i) => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve({
        src: ev.target.result,
        label: LABELS[images.length + i] || `구역${images.length + i + 1}`,
        report: "", analyzing: false, done: false
      });
      reader.readAsDataURL(file);
    })));
    setImages(prev => [...prev, ...newImgs].slice(0, 5));
  };

  const analyze = async idx => {
    const img = images[idx];
    setImages(prev => prev.map((im, i) => i === idx ? { ...im, analyzing: true, report: "", done: false } : im));
    const base64 = img.src.split(",")[1];
    const mediaType = img.src.split(";")[0].split(":")[1];

    // 최신 문진 데이터 조회 (실패해도 기본값으로 분석 진행)
    let surveyData = null;
    try {
      const { data: surveyRows } = await supabase
        .from("surveys")
        .select("scalp_concerns, scalp_type, shampoo_frequency, sleep, stress")
        .eq("phone", customer.phone)
        .order("created_at", { ascending: false })
        .limit(1);
      surveyData = surveyRows?.[0] ?? null;
    } catch { /* 문진 데이터 없으면 기본값 사용 */ }

    const sleepMap = { "5시간 이하": 30, "5~6시간": 50, "6~7시간": 70, "7시간 이상": 85 };
    const visits = Array.isArray(customer.visits) ? customer.visits : [];
    // visits는 date ASC 정렬 → 마지막이 최신, 마지막-1이 이전 방문
    const prevVisit = visits.length >= 2 ? visits[visits.length - 2] : null;

    const birthDate = customer.birth_date;
    const currentAge = birthDate
      ? new Date().getFullYear() - new Date(birthDate).getFullYear()
      : (customer.age || 0);

    const customerInfoFull = {
      name: customer.name,
      age: currentAge,
      label: img.label,
      sleep: surveyData?.sleep ? (sleepMap[surveyData.sleep] ?? 50) : 50,
      stress: surveyData?.stress ? surveyData.stress * 20 : 50,
      concerns: Array.isArray(surveyData?.scalp_concerns) && surveyData.scalp_concerns.length > 0
        ? surveyData.scalp_concerns.join(", ")
        : "없음",
      scalpType: surveyData?.scalp_type || "미기재",
      shampooFreq: surveyData?.shampoo_frequency || "미기재",
      prevMoisture: prevVisit?.moisture ?? null,
      prevElasticity: prevVisit?.elasticity ?? null,
    };

    try {
      let fullText = "";
      await callAI(
        null,
        base64, mediaType,
        text => {
          fullText += text;
          setImages(prev => prev.map((im, i) => i === idx ? { ...im, report: fullText } : im));
        },
        img.label, customer.name, currentAge,
        customerInfoFull
      );
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, analyzing: false, done: true } : im));
    } catch (e) {
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, report: `⚠️ 오류: ${e.message}`, analyzing: false, done: true } : im));
    }
  };


  const saveReport = async () => {
    const completedImages = images.filter(im => im.done && im.report);
    if (completedImages.length === 0) return;

    const allReportsText = completedImages
      .map(im => "[" + im.label + "]\n" + im.report)
      .join("\n\n---\n\n");

    const extractNum = (text, re) => {
      const m = text.match(re);
      return m ? Math.min(100, Math.max(0, parseInt(m[1]))) : null;
    };
    const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 50;

    const moistures = completedImages.map(im => extractNum(im.report, /두피\s*수분도[^\d]*(\d+)/)).filter(v => v !== null);
    const elasticities = completedImages.map(im => extractNum(im.report, /모낭\s*건강도[^\d]*(\d+)/)).filter(v => v !== null);
    const avgMoisture = moistures.length > 0 ? avg(moistures) : null;
    const avgElasticity = elasticities.length > 0 ? avg(elasticities) : null;

    const firstReport = completedImages[0].report;
    const SCALP_TYPES = ["건성", "지성", "복합성", "민감성", "정상", "예민"];
    const foundType = SCALP_TYPES.find(t => firstReport.includes(t));
    const scalpType = foundType ? foundType + " 두피" : "분석 참조";

    const concernsSection = firstReport.match(/주의\s*소견[^\n]*\n([\s\S]*?)(?:\n\*\*|$)/);
    const concerns = concernsSection
      ? concernsSection[1].split('\n').map(l => l.replace(/^[\s\-·•]+/, '').trim()).filter(l => l.length > 0)
      : [];

    const reportJson = JSON.stringify({
      moisture: avg(moistures),
      elasticity: avg(elasticities),
      scalpType,
      concerns,
      aiAnalysis: allReportsText,
      analyzedAt: new Date().toISOString(),
    });

    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

    const { data: todayVisitRows } = await supabase
      .from("visits")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("date", today)
      .order("id", { ascending: false })
      .limit(1);
    const todayVisit = todayVisitRows?.[0] ?? null;

    let visitId, savedVisit, isNew;

    if (todayVisit) {
      const updatePayload = { scalp_report: reportJson };
      if (avgMoisture !== null) updatePayload.moisture = avgMoisture;
      if (avgElasticity !== null) updatePayload.elasticity = avgElasticity;
      await supabase.from("visits").update(updatePayload).eq("id", todayVisit.id);
      visitId = todayVisit.id;
      savedVisit = { ...todayVisit, ...updatePayload };
      isNew = false;
    } else {
      const { data: newVisit, error: visitInsertErr } = await supabase.from("visits").insert({
        customer_id: customer.id,
        date: today,
        service: "두피 케어",
        sleep: 50,
        stress: 50,
        moisture: avgMoisture ?? 55,
        elasticity: avgElasticity ?? 50,
        score: 51,
        scalp_report: reportJson,
      }).select().single();
      if (visitInsertErr || !newVisit) {
        alert("방문 기록 저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      visitId = newVisit.id;
      savedVisit = newVisit;
      isNew = true;
    }

    // Storage 사진 업로드
    if (visitId) {
      const imageUrls = [];
      for (const im of completedImages) {
        try {
          const blob = await fetch(im.src).then(r => r.blob());
          const labelMap = { '정수리': 'top', '측두부(좌)': 'left', '측두부(우)': 'right', '후두부': 'back', '전체': 'full' };
          const labelEn = labelMap[im.label] || im.label.replace(/[^a-zA-Z0-9]/g, '_');
          const path = `${customer.id}/${visitId}/${labelEn}_${Date.now()}.jpg`;
          const { data: upData, error: upErr } = await supabase.storage
            .from("scalp-images")
            .upload(path, blob, { contentType: "image/jpeg", upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("scalp-images").getPublicUrl(path);
            imageUrls.push(urlData.publicUrl);
          }
        } catch {
        }
      }
      if (imageUrls.length > 0) {
        await supabase.from("visits").update({ scalp_images: imageUrls }).eq("id", visitId);
        savedVisit = { ...savedVisit, scalp_images: imageUrls };
      }
    }

    if (onUpdate) {
      if (isNew) {
        onUpdate({ ...customer, visits: [...(customer.visits || []), savedVisit] });
      } else {
        onUpdate({ ...customer, visits: [...(customer.visits || []).filter(v => v.id !== visitId), savedVisit] });
      }
    }
    alert(isNew ? "✅ 방문 기록 + 두피 분석 저장 완료!" : "✅ 두피 분석 결과가 저장됐어요!");
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>📸 두피 사진 ({images.length}/5)</h3>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>정수리·측두부·후두부 최대 5장</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {images.length < 5 && <Btn variant="outline" size="sm" onClick={() => fileRef.current.click()}>+ 사진 추가</Btn>}
            {images.length > 0 && (
              <Btn variant="gold" size="sm" onClick={() => images.forEach((_, i) => { if (!images[i].done && !images[i].analyzing) analyze(i); })}>
                🔬 전체 분석
              </Btn>
            )}
          </div>
        </div>

        {images.length > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{ position: "relative", width: 82, height: 82, borderRadius: 10, overflow: "hidden", border: `2px solid ${activeIdx === i ? C.gold : C.border}`, cursor: "pointer" }}>
                <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", padding: "2px 4px", textAlign: "center" }}>
                  <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{img.label}</span>
                </div>
                {img.done && (
                  <div style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>✓</div>
                )}
                {img.analyzing && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚙️</div>
                )}
                <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); setActiveIdx(0); }} style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            {images.length < 5 && (
              <div onClick={() => fileRef.current.click()} style={{ width: 82, height: 82, borderRadius: 10, border: `2px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: C.bg }}>
                <span style={{ fontSize: 22, color: C.muted }}>+</span>
                <span style={{ fontSize: 9, color: C.muted }}>추가</span>
              </div>
            )}
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
              {!images[activeIdx]?.done && !images[activeIdx]?.analyzing && (
                <Btn variant="gold" size="sm" onClick={() => analyze(activeIdx)}>🔬 분석</Btn>
              )}
            </div>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
              <img src={images[activeIdx]?.src} alt="두피" style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
              {images[activeIdx]?.analyzing && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>AI 분석 중...</p>
                  <div style={{ width: "60%", height: 4, background: C.border, borderRadius: 99 }}>
                    <div style={{ height: "100%", width: "70%", background: C.gold, borderRadius: 99 }} />
                  </div>
                </div>
              )}
              {images[activeIdx]?.done && (
                <div style={{ position: "absolute", top: 10, right: 10, background: C.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>✓ 완료</div>
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>📋 AI 진단 리포트</h3>
            <ScalpReportView report={images[activeIdx]?.report} analyzing={images[activeIdx]?.analyzing} />
            {images.some(im => im.done) && (
              <button
                onClick={saveReport}
                style={{ marginTop: 12, width: "100%", padding: "10px", background: C.green, color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                💾 분석 결과 저장하기
              </button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function CompareSection({ current, prev, compact = false }) {
  const metrics = [
    { key: "score",      label: "종합 점수",  higherIsBetter: true },
    { key: "moisture",   label: "수분도",      higherIsBetter: true },
    { key: "elasticity", label: "탄력도",      higherIsBetter: true },
    { key: "sleep",      label: "수면 품질",   higherIsBetter: true },
    { key: "stress",     label: "스트레스",    higherIsBetter: false },
  ];

  if (!prev) {
    return (
      <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
        <p style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginBottom: 3 }}>📈 방문 추이</p>
        <p style={{ fontSize: 12, color: C.muted }}>첫 방문 기록입니다. 다음 방문부터 변화를 확인할 수 있어요</p>
      </div>
    );
  }

  const scoreDiff = current.score - prev.score;
  const overallGood = scoreDiff > 0;

  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>📈 지난 방문 대비 변화</p>
        <p style={{ fontSize: 10, color: C.muted }}>기준: {prev.date}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
        {metrics.map(m => {
          const diff = current[m.key] - prev[m.key];
          const improved = m.higherIsBetter ? diff > 0 : diff < 0;
          const color = diff === 0 ? C.muted : improved ? C.green : C.red;
          const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "─";
          return (
            <div key={m.key} style={{ textAlign: "center", background: "#fff", borderRadius: 8, padding: "8px 4px" }}>
              <p style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{m.label}</p>
              <p style={{ fontSize: 15, fontWeight: 900, color }}>{arrow}{Math.abs(diff)}</p>
              <p style={{ fontSize: 9, color: C.muted }}>{prev[m.key]}→{current[m.key]}</p>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, textAlign: "center", marginTop: 8, fontWeight: 700,
        color: scoreDiff === 0 ? C.muted : overallGood ? C.green : C.red }}>
        {scoreDiff === 0 ? "변화 없음" : overallGood ? "개선되고 있어요 👍" : "관리가 필요해요 ⚠️"}
      </p>
    </div>
  );
}

function HistoryTab({ customer, onAddVisit, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    service: "", sleep: 50, stress: 50, moisture: 50, elasticity: 50, note: ""
  });

  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const reversedVisits = [...visits].reverse();

  useEffect(() => {
    if (reversedVisits.length > 0) {
      setExpandedIds([reversedVisits[0].id]);
    }
  }, [visits.length]);

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
        const stressVal = data.stress ? data.stress * 20 : 50;
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
  const score = f => Math.round(
    Number(f.sleep) * 0.2 +
    (100 - Number(f.stress)) * 0.2 +
    Number(f.moisture) * 0.3 +
    Number(f.elasticity) * 0.3
  );

  const meta = {
    sleep: { label: "수면 품질", color: C.blue },
    stress: { label: "스트레스", color: C.red },
    moisture: { label: "두피 수분", color: C.gold },
    elasticity: { label: "모발 탄력", color: C.green },
    score: { label: "종합 점수", color: C.text }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openReport = (phone) => {
    const url = `${window.location.origin}/report?phone=${encodeURIComponent(phone)}`;
    window.open(url, "_blank");
  };

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("visits")
      .insert({
        customer_id: customer.id,
        date: form.date,
        service: form.service,
        sleep: Number(form.sleep),
        stress: Number(form.stress),
        moisture: Number(form.moisture),
        elasticity: Number(form.elasticity),
        score: score(form),
        note: form.note
      })
      .select()
      .single();
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    onAddVisit(data);
    setShowForm(false);
    setExpandedIds([data.id]);
  };

  const startEdit = (e, visit) => {
    e.stopPropagation();
    setEditingId(visit.id);
    setEditForm({ date: visit.date, service: visit.service || "", sleep: visit.sleep, stress: visit.stress, moisture: visit.moisture, elasticity: visit.elasticity, note: visit.note || "" });
    setExpandedIds(prev => prev.includes(visit.id) ? prev : [...prev, visit.id]);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    setUpdating(true);
    const updated = { date: editForm.date, service: editForm.service, sleep: Number(editForm.sleep), stress: Number(editForm.stress), moisture: Number(editForm.moisture), elasticity: Number(editForm.elasticity), score: score(editForm), note: editForm.note };
    const { error } = await supabase.from("visits").update(updated).eq("id", editingId);
    setUpdating(false);
    if (error) { alert("수정 실패: " + error.message); return; }
    onUpdate({ ...customer, visits: visits.map(v => v.id === editingId ? { ...v, ...updated } : v) });
    setEditingId(null);
  };

  const deleteVisit = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("이 방문 기록을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("visits").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); return; }
    onUpdate({ ...customer, visits: visits.filter(v => v.id !== id) });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>📅 방문 기록 ({visits.length}회)</h3>
        <Btn variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ 닫기" : "+ 방문 추가"}
        </Btn>
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
                <label style={{ fontSize: 12, color: C.sub, fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{meta[k].label}</span>
                  <span style={{ color: meta[k].color, fontWeight: 800 }}>{form[k]}</span>
                </label>
                <input type="range" min={0} max={100} value={form[k]}
                  onChange={e => set(k, e.target.value)}
                  style={{ width: "100%", accentColor: meta[k].color }} />
              </div>
            ))}
          </div>
          <textarea value={form.note} onChange={e => set("note", e.target.value)}
            placeholder="스타일리스트 메모..."
            style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
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
              return (
                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <Spark values={vals} color={meta[k].color} />
                  <p style={{ fontSize: 20, fontWeight: 800, color: meta[k].color, marginTop: 4 }}>{last}</p>
                  {d !== null && <p style={{ fontSize: 10, color: d >= 0 ? C.green : C.red }}>{d >= 0 ? "▲" : "▼"}{Math.abs(d)}</p>}
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{meta[k].label}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {reversedVisits.map((v, i) => {
          const isExpanded = expandedIds.includes(v.id);
          const isLatest = i === 0;
          return (
            <Card key={v.id} style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => toggleExpand(v.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 20px", cursor: "pointer",
                  background: isExpanded ? C.goldBg : "#fff",
                  borderBottom: isExpanded ? `1px solid ${C.goldLight}` : "none",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{v.date}</span>
                  {isLatest && (
                    <span style={{ fontSize: 10, background: C.goldBg, color: C.gold, border: `1px solid ${C.goldLight}`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>최근</span>
                  )}
                  {v.service && <span style={{ fontSize: 12, color: C.muted }}>{v.service}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Chip score={v.score} />
                  <button onClick={e => startEdit(e, v)} title="수정" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15, padding: "4px 5px", borderRadius: 6, lineHeight: 1 }}>✏️</button>
                  <button onClick={e => deleteVisit(e, v.id)} title="삭제" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15, padding: "4px 5px", borderRadius: 6, lineHeight: 1 }}>🗑️</button>
                  <span style={{ color: C.muted, fontSize: 14, transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: "16px 20px" }}>
                  {editingId === v.id ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="방문일" value={editForm.date} onChange={val => setEditForm(p => ({ ...p, date: val }))} type="date" />
                        <Field label="시술 내용" value={editForm.service} onChange={val => setEditForm(p => ({ ...p, service: val }))} placeholder="두피 스케일링 등" />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        {["sleep", "stress", "moisture", "elasticity"].map(k => (
                          <div key={k}>
                            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>{meta[k].label}</span>
                              <span style={{ color: meta[k].color, fontWeight: 800 }}>{editForm[k]}</span>
                            </label>
                            <input type="range" min={0} max={100} value={editForm[k]}
                              onChange={e => setEditForm(p => ({ ...p, [k]: e.target.value }))}
                              style={{ width: "100%", accentColor: meta[k].color }} />
                          </div>
                        ))}
                      </div>
                      <textarea value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                        placeholder="스타일리스트 메모..."
                        style={{ width: "100%", height: 60, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="ghost" size="sm" onClick={cancelEdit} style={{ flex: 1 }}>취소</Btn>
                        <Btn variant="gold" size="sm" onClick={saveEdit} disabled={updating} style={{ flex: 2 }}>{updating ? "저장 중..." : "✓ 수정 완료"}</Btn>
                      </div>
                    </div>
                  ) : (
                  <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                    {["sleep", "stress", "moisture", "elasticity"].map(k => (
                      <div key={k}>
                        <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{meta[k].label}</p>
                        <Bar value={v[k]} color={meta[k].color} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: meta[k].color, marginTop: 2 }}>{v[k]}</p>
                      </div>
                    ))}
                  </div>
                  {v.note && (
                    <p style={{ fontSize: 12, color: C.sub, background: C.bg, padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                      📝 {v.note}
                    </p>
                  )}
                  {v.scalp_report && (() => {
                    const r = parseScalpReport(v.scalp_report);
                    return (
                      <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: C.gold, marginBottom: 8 }}>🔬 두피 분석 결과</p>
                        {r?.scalpType && r.scalpType !== "분석 참조" && (
                          <p style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>두피 타입: <strong>{r.scalpType}</strong></p>
                        )}
                        {r?.moisture !== undefined && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: C.muted }}>수분도</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: C.blue }}>{r.moisture}</span>
                            </div>
                            <Bar value={r.moisture} color={C.blue} />
                          </div>
                        )}
                        {r?.elasticity !== undefined && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: C.muted }}>탄력도</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{r.elasticity}</span>
                            </div>
                            <Bar value={r.elasticity} color={C.green} />
                          </div>
                        )}
                        {r?.concerns?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>주의 소견</p>
                            <ul style={{ paddingLeft: 14, margin: 0 }}>
                              {r.concerns.map((c, i) => (
                                <li key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>상세 분석</p>
                          <div style={{ fontSize: 12 }}>{renderMd(r?.aiAnalysis || String(v.scalp_report))}</div>
                        </div>
                      </div>
                    );
                  })()}
                  <CompareSection current={v} prev={reversedVisits[i + 1] || null} />
                  <button
                    onClick={() => openReport(customer.phone)}
                    style={{
                      width: "100%", padding: "11px", borderRadius: 10,
                      border: `1.5px solid ${C.gold}`,
                      background: "#fff", color: C.gold,
                      fontSize: 13, fontWeight: 800, fontFamily: "inherit",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6, transition: "all 0.18s",
                      marginTop: 12,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.goldBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                  >
                    📋 리포트 확인
                  </button>
                  </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {visits.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
            아직 방문 기록이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function KakaoTab({ customer }) {
  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const reversedVisits = [...visits].reverse();

  const [selectedVisitId, setSelectedVisitId] = useState(reversedVisits[0]?.id ?? null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const selectedVisit = visits.find(v => String(v.id) === String(selectedVisitId)) ?? null;

  const openReport = () => {
    const url = `${window.location.origin}/report?phone=${encodeURIComponent(customer.phone)}`;
    window.open(url, "_blank");
  };

  const sendAlimtalk = async () => {
    if (!selectedVisit) return alert("방문 기록을 선택해주세요.");
    if (!customer.phone) return alert("고객 전화번호가 없습니다.");
    setSending(true);
    setSendError("");
    setSent(false);
    const reportUrl = `${window.location.origin}/report?phone=${encodeURIComponent(customer.phone)}`;
    try {
      const res = await fetch("/api/sendAlimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          phone: customer.phone,
          sleep: selectedVisit.sleep,
          stress: selectedVisit.stress,
          moisture: selectedVisit.moisture,
          elasticity: selectedVisit.elasticity,
          score: selectedVisit.score,
          stylist: customer.stylist,
          reportUrl,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) { setSent(true); } else { setSendError(result.error || "알림톡 발송에 실패했습니다."); }
    } catch (e) { setSendError("네트워크 오류: " + e.message); }
    setSending(false);
  };

  const meta = {
    sleep: { label: "수면 품질", color: C.blue },
    stress: { label: "스트레스", color: C.red },
    moisture: { label: "두피 수분", color: C.gold },
    elasticity: { label: "모발 탄력", color: C.green },
  };

  if (visits.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 14 }}>방문 기록을 먼저 추가해주세요.</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📅 방문 날짜 선택</h3>
          <select
            value={selectedVisitId ?? ""}
            onChange={e => { setSelectedVisitId(Number(e.target.value)); setSent(false); setSendError(""); }}
            style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${C.gold}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", fontWeight: 700, color: C.text, background: C.goldBg, outline: "none", cursor: "pointer" }}
          >
            {reversedVisits.map((v, i) => (
              <option key={v.id} value={v.id}>{v.date} · {v.score}점 {i === 0 ? "(최근)" : ""}</option>
            ))}
          </select>
        </Card>

        {selectedVisit && (
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📊 방문 요약</h3>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: selectedVisit.score >= 70 ? C.green : selectedVisit.score >= 50 ? "#b07800" : C.red }}>{selectedVisit.score}점</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{selectedVisit.date} · {selectedVisit.service || "두피 케어"}</p>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {["sleep", "stress", "moisture", "elasticity"].map(k => (
                <div key={k}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{meta[k].label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: meta[k].color }}>{selectedVisit[k]}</span>
                  </div>
                  <Bar value={selectedVisit[k]} color={meta[k].color} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📨 발송</h3>
          <div style={{ background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800 }}>{customer.name}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{customer.phone}</p>
              </div>
              {selectedVisit && <Chip score={selectedVisit.score} />}
            </div>
          </div>
          <button onClick={openReport} style={{ width: "100%", padding: "12px", borderRadius: 10, marginBottom: 10, border: `1.5px solid ${C.gold}`, background: "#fff", color: C.gold, fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.background = C.goldBg} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            📋 리포트 확인 (새탭)
          </button>
          <button onClick={sendAlimtalk} disabled={sending || !selectedVisit} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: sending ? C.border : C.kakao, color: "#3a1d00", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: sending ? 0.7 : 1 }}>
            {sending ? "📤 발송 중..." : "📨 카카오 알림톡 발송"}
          </button>
          {sent && (
            <div style={{ marginTop: 12, background: "#edf7f1", border: "1px solid #a8d5b5", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ color: C.green, fontWeight: 800 }}>✅ 알림톡 발송 완료!</p>
              <p style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{customer.name}님께 리포트 링크 전송됨</p>
            </div>
          )}
          {sendError && (
            <div style={{ marginTop: 12, background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>⚠️ 발송 실패</p>
              <p style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{sendError}</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>📱 리포트 미리보기</h3>
        {selectedVisit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900 }}>{customer.name}님</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selectedVisit.date} · {customer.stylist} 스타일리스트</p>
              <p style={{ fontSize: 32, fontWeight: 900, marginTop: 10, color: selectedVisit.score >= 70 ? C.green : selectedVisit.score >= 50 ? "#b07800" : C.red }}>{selectedVisit.score}점</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selectedVisit.score >= 70 ? "두피 상태가 양호해요 👍" : selectedVisit.score >= 50 ? "조금 더 관리가 필요해요 💆" : "집중 케어가 필요해요 ⚠️"}</p>
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 12 }}>📊 상세 지표</p>
              {["sleep", "stress", "moisture", "elasticity"].map(k => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{meta[k].label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: meta[k].color }}>{selectedVisit[k]}점</span>
                  </div>
                  <Bar value={selectedVisit[k]} color={meta[k].color} />
                </div>
              ))}
            </div>
            {selectedVisit.scalp_report && (() => {
              const r = parseScalpReport(selectedVisit.scalp_report);
              const displayText = r?.aiAnalysis
                ? r.aiAnalysis
                : String(selectedVisit.scalp_report);
              const preview = displayText.slice(0, 200);
              return (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: C.gold }}>🔬 AI 두피 분석</p>
                  {r?.scalpType && r.scalpType !== "분석 참조" && (
                    <p style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>두피 타입: {r.scalpType}</p>
                  )}
                  <div style={{ fontSize: 11 }}>{renderMd(preview + (displayText.length > 200 ? "..." : ""))}</div>
                </div>
              );
            })()}
            {selectedVisit.note && (
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>📝 스타일리스트 메모</p>
                <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}>{selectedVisit.note}</p>
              </div>
            )}
            <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>🧴 AI 제품 추천은 제품 등록 후 추가될 예정이에요</p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p style={{ fontSize: 13 }}>방문 날짜를 선택해주세요</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function CustomerDetail({ customer, onBack, onUpdate, onDeleteCustomer }) {
  const [tab, setTab] = useState("scalp");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const TABS = [{ id: "scalp", label: "🔬 두피 분석" }, { id: "history", label: "📅 방문 히스토리" }, { id: "kakao", label: "💬 카카오 발송" }];
  const visits = Array.isArray(customer.visits) ? customer.visits : [];
  const latest = visits[visits.length - 1];

  const deleteCustomer = async () => {
    if (!window.confirm(`${customer.name}님을 삭제할까요? 방문 기록도 모두 삭제됩니다.`)) return;
    await supabase.from("visits").delete().eq("customer_id", customer.id);
    await supabase.from("customers").delete().eq("id", customer.id);
    onDeleteCustomer(customer.id);
  };

  const startEditProfile = () => {
    setProfileForm({
      name: customer.name || "",
      phone: customer.phone || "",
      birth_date: customer.birth_date || "",
      gender: customer.gender || "여",
      stylist: customer.stylist || STYLISTS[0],
      memo: customer.memo || "",
    });
    setEditingProfile(true);
  };

  const cancelEditProfile = () => setEditingProfile(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    const birthYear = profileForm.birth_date ? parseInt(profileForm.birth_date.split('-')[0]) : null;
    const computedAge = birthYear ? new Date().getFullYear() - birthYear : customer.age;
    const updates = {
      name: profileForm.name,
      phone: profileForm.phone,
      birth_date: profileForm.birth_date || null,
      gender: profileForm.gender,
      stylist: profileForm.stylist,
      memo: profileForm.memo,
      age: computedAge,
    };
    const { error } = await supabase.from("customers").update(updates).eq("id", customer.id);
    setSavingProfile(false);
    if (error) { alert("수정 실패: " + error.message); return; }
    onUpdate({ ...customer, ...updates });
    setEditingProfile(false);
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
            <button onClick={startEditProfile} title="고객 정보 수정" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15, padding: "2px 4px", borderRadius: 6, lineHeight: 1 }}>✏️</button>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>담당: {customer.stylist} · 등록일: {customer.join_date} · 총 {visits.length}회 방문{customer.memo && ` · 📝 ${customer.memo}`}</p>
        </div>
      </div>

      {editingProfile && (
        <Card style={{ marginBottom: 20, background: C.goldBg, border: `1px solid ${C.goldLight}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>✏️ 고객 정보 수정</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="이름" value={profileForm.name} onChange={v => setProfileForm(p => ({ ...p, name: v }))} placeholder="홍길동" />
            <Field label="전화번호" value={profileForm.phone} onChange={v => setProfileForm(p => ({ ...p, phone: v }))} placeholder="010-0000-0000" />
            <Field label="생년월일" value={profileForm.birth_date} onChange={v => setProfileForm(p => ({ ...p, birth_date: v }))} type="date" />
            <div>
              <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>성별</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["여", "남"].map(g => (
                  <button key={g} onClick={() => setProfileForm(p => ({ ...p, gender: g }))} style={{ flex: 1, padding: "9px", border: `1px solid ${profileForm.gender === g ? C.gold : C.border}`, borderRadius: 9, background: profileForm.gender === g ? C.goldBg : "#fff", color: profileForm.gender === g ? C.gold : C.sub, fontWeight: profileForm.gender === g ? 800 : 400, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{g}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>담당 스타일리스트</label>
            <select value={profileForm.stylist} onChange={e => setProfileForm(p => ({ ...p, stylist: e.target.value }))} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              {STYLISTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 5, fontWeight: 600 }}>메모</label>
            <textarea value={profileForm.memo} onChange={e => setProfileForm(p => ({ ...p, memo: e.target.value }))} placeholder="알러지, 선호사항..." style={{ width: "100%", height: 70, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={cancelEditProfile} style={{ flex: 1 }}>취소</Btn>
            <Btn variant="gold" onClick={saveProfile} disabled={savingProfile} style={{ flex: 2 }}>{savingProfile ? "저장 중..." : "✓ 저장"}</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f0ece4", padding: 5, borderRadius: 12 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: 10, border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? C.text : C.muted, boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.18s" }}>{t.label}</button>)}
      </div>
      <div style={{ display: tab === "scalp" ? "block" : "none" }}><ScalpTab customer={customer} onUpdate={onUpdate} /></div>
      <div style={{ display: tab === "history" ? "block" : "none" }}><HistoryTab customer={customer} onAddVisit={v => onUpdate({ ...customer, visits: [...visits, v] })} onUpdate={onUpdate} /></div>
      <div style={{ display: tab === "kakao" ? "block" : "none" }}><KakaoTab customer={customer} /></div>
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
    } catch { }
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 12, color: C.muted }}>DB 연결됨</span>
            <Btn variant="ghost" size="sm" onClick={() => setLoggedIn(false)}>로그아웃</Btn>
          </div>
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
