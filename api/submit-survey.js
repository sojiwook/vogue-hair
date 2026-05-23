import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE 환경변수 미설정');
  return createClient(url, key);
};

// 서버는 UTC이므로 KST(+9h) 기준 날짜로 보정
const getKSTDate = () => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`;
};

const calcAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않는 메서드입니다' });

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    console.error('[submit-survey] 환경변수 오류:', e.message);
    return res.status(500).json({ error: '서버 설정 오류입니다' });
  }

  const { type } = req.body;
  try {
    if (type === 'check-phone') return await handleCheckPhone(req, res, supabase);
    if (type === 'new')         return await handleNewSurvey(req, res, supabase);
    if (type === 'revisit')     return await handleRevisitSurvey(req, res, supabase);
    return res.status(400).json({ error: '알 수 없는 요청 타입입니다' });
  } catch (error) {
    console.error('[submit-survey] 예외:', error.message);
    return res.status(500).json({ error: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
  }
}

// 재방문 전화번호 확인 — 이름·마지막 방문일만 반환 (최소 노출)
async function handleCheckPhone(req, res, supabase) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: '전화번호가 필요합니다' });

  const { data: rows } = await supabase
    .from('customers').select('id, name, phone').eq('phone', phone).limit(1);
  const found = rows?.[0] ?? null;
  if (!found) return res.status(200).json({ found: false });

  const { data: visits } = await supabase
    .from('visits').select('date')
    .eq('customer_id', found.id).order('date', { ascending: false }).limit(1);

  const lastDate = visits?.[0]?.date ?? null;
  const daysSince = lastDate
    ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
    : null;

  return res.status(200).json({ found: true, id: found.id, name: found.name, phone: found.phone, lastDate, daysSince });
}

// 신규 문진 제출
async function handleNewSurvey(req, res, supabase) {
  const { form } = req.body;
  if (!form?.name || !form?.phone) {
    return res.status(400).json({ error: '이름과 전화번호는 필수입니다' });
  }

  const SLEEP_MAP = { '5시간 이하': 30, '5~6시간': 50, '6~7시간': 70, '7시간 이상': 85 };
  const COND_MAP  = { '나쁨': 35, '보통': 55, '좋음': 75 };

  // 1. surveys upsert
  const { data: existingSurveys } = await supabase
    .from('surveys').select('id').eq('phone', form.phone)
    .order('created_at', { ascending: false }).limit(1);
  const existingSurvey = existingSurveys?.[0] ?? null;

  const surveyPayload = {
    name: form.name, sleep: form.sleep, stress: form.stress,
    condition: form.condition, scalp_concerns: form.scalp_concerns,
    shampoo_frequency: form.shampoo_frequency, scalp_type: form.scalp_type,
  };
  if (existingSurvey) {
    await supabase.from('surveys').update(surveyPayload).eq('id', existingSurvey.id);
  } else {
    await supabase.from('surveys').insert({ ...surveyPayload, phone: form.phone });
  }

  // 2. customers upsert
  const age = calcAge(form.birth_date);
  const { data: existingCustomers } = await supabase
    .from('customers').select('id').eq('phone', form.phone).limit(1);
  const existing = existingCustomers?.[0] ?? null;

  let customerId;
  if (existing) {
    await supabase.from('customers').update({
      stylist: form.stylist, gender: form.gender,
      birth_date: form.birth_date || null, age, marketing_agree: form.marketing_agree,
    }).eq('id', existing.id);
    customerId = existing.id;
  } else {
    const { data: newCustomer, error } = await supabase.from('customers').insert({
      name: form.name, phone: form.phone, stylist: form.stylist,
      gender: form.gender, birth_date: form.birth_date || null,
      age, marketing_agree: form.marketing_agree,
      join_date: new Date().toISOString().slice(0, 10), memo: '',
    }).select('id').single();
    if (error || !newCustomer) {
      console.error('[submit-survey/new] customers insert 오류:', error?.message);
      return res.status(500).json({ error: '고객 정보 저장에 실패했습니다' });
    }
    customerId = newCustomer.id;
  }

  // 3. 수치 계산
  const { data: surveyRows } = await supabase
    .from('surveys').select('sleep, stress, condition').eq('phone', form.phone)
    .order('created_at', { ascending: false }).limit(1);
  const surveyRow = surveyRows?.[0] ?? null;

  const sleepVal   = SLEEP_MAP[surveyRow?.sleep]    ?? SLEEP_MAP[form.sleep]    ?? 50;
  const stressVal  = Number(surveyRow?.stress       ?? form.stress) * 20;
  const moistVal   = COND_MAP[surveyRow?.condition] ?? COND_MAP[form.condition] ?? 55;
  const elasticity = 50;
  const score = Math.round(sleepVal * 0.2 + (100 - stressVal) * 0.2 + moistVal * 0.3 + elasticity * 0.3);

  // 4. visits upsert (KST 기준 날짜)
  const today = getKSTDate();
  const { data: todayVisits, error: todayVisitsErr } = await supabase
    .from('visits').select('id').eq('customer_id', customerId).eq('date', today).limit(1);
  const todayVisit = todayVisits?.[0] ?? null;

  if (!todayVisitsErr) {
    if (!todayVisit) {
      await supabase.from('visits').insert({
        customer_id: customerId, date: today, service: '두피 케어',
        sleep: sleepVal, stress: stressVal, moisture: moistVal, elasticity, score,
      });
    } else {
      await supabase.from('visits').update({
        sleep: sleepVal, stress: stressVal, moisture: moistVal, elasticity, score,
      }).eq('id', todayVisit.id);
    }
  }

  // 5. surveys에 visit_id 연결
  try {
    const { data: linked } = await supabase
      .from('visits').select('id').eq('customer_id', customerId).eq('date', today).limit(1);
    if (linked?.[0]?.id) {
      await supabase.from('surveys').update({ visit_id: linked[0].id }).eq('phone', form.phone);
    }
  } catch {}

  return res.status(200).json({ success: true });
}

// 재방문 문진 제출
async function handleRevisitSurvey(req, res, supabase) {
  const { form, customerId } = req.body;
  if (!customerId || !form?.phone) {
    return res.status(400).json({ error: '고객 정보가 필요합니다' });
  }

  // 1. surveys upsert
  const { data: existingSurveys } = await supabase
    .from('surveys').select('id').eq('phone', form.phone)
    .order('created_at', { ascending: false }).limit(1);
  const existingSurvey = existingSurveys?.[0] ?? null;

  const surveyData = {
    name: form.customerName,
    scalp_change: form.scalp_change, sleep_change: form.sleep_change,
    stress_change: form.stress_change, action_taken: form.action_taken,
    action_effect: form.action_effect || null,
    scalp_concerns: form.scalp_concerns, visit_type: 'revisit',
  };
  if (existingSurvey) {
    await supabase.from('surveys').update(surveyData).eq('id', existingSurvey.id);
  } else {
    await supabase.from('surveys').insert({ ...surveyData, phone: form.phone });
  }

  // 2. visits upsert (KST 기준 날짜)
  const SLEEP_MAP  = { '잘 자요': 85, '비슷해요': 70, '못 자요': 50 };
  const STRESS_MAP = { '줄었어요': 20, '비슷해요': 50, '늘었어요': 80 };
  const sleepVal  = SLEEP_MAP[form.sleep_change]   ?? 70;
  const stressVal = STRESS_MAP[form.stress_change] ?? 50;
  const score = Math.round(sleepVal * 0.2 + (100 - stressVal) * 0.2 + 50 * 0.3 + 50 * 0.3);

  const today = getKSTDate();
  const { data: todayVisits } = await supabase
    .from('visits').select('id').eq('customer_id', customerId).eq('date', today).limit(1);
  const todayVisit = todayVisits?.[0] ?? null;

  const visitData = { sleep: sleepVal, stress: stressVal, moisture: 50, elasticity: 50, score };
  if (!todayVisit) {
    await supabase.from('visits').insert({ customer_id: customerId, date: today, service: '두피 케어', ...visitData });
  } else {
    await supabase.from('visits').update(visitData).eq('id', todayVisit.id);
  }

  // 3. surveys에 visit_id 연결
  try {
    const { data: linked } = await supabase
      .from('visits').select('id').eq('customer_id', customerId).eq('date', today).limit(1);
    if (linked?.[0]?.id) {
      await supabase.from('surveys').update({ visit_id: linked[0].id }).eq('phone', form.phone);
    }
  } catch {}

  return res.status(200).json({ success: true });
}
