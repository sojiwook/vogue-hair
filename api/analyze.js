function parseScalpScore(text) {
  const m = text.match(/\[SCORE\]([\s\S]*?)\[\/SCORE\]/);
  if (!m) return null;
  for (let i = 0; i < 2; i++) {
    try {
      const raw = i === 0 ? m[1].trim() : m[1].replace(/\s+/g, '');
      const parsed = JSON.parse(raw);
      if (typeof parsed.scalp_score === 'number' && parsed.detail && typeof parsed.detail === 'object') {
        // basis(판단 근거)는 없어도 분석은 성립하므로 선택 항목으로 둔다.
        // 문자열만 남겨 예상치 못한 구조가 저장되는 걸 막는다.
        let basis = null;
        if (parsed.basis && typeof parsed.basis === 'object' && !Array.isArray(parsed.basis)) {
          basis = {};
          for (const [k, v] of Object.entries(parsed.basis)) {
            if (typeof v === 'string' && v.trim()) basis[k] = v.trim().slice(0, 60);
          }
          if (Object.keys(basis).length === 0) basis = null;
        }
        return {
          scalp_score: Math.min(100, Math.max(0, Math.round(parsed.scalp_score))),
          score_detail: parsed.detail,
          score_basis: basis,
        };
      }
    } catch { /* 2차 시도로 진행 */ }
  }
  console.warn('[analyze] [SCORE] 블록 JSON 파싱 2회 실패 — null 반환');
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 환경변수 체크
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    console.error('[analyze] ANTHROPIC_KEY 환경변수 미설정');
    return res.status(500).json({ error: 'ANTHROPIC_KEY 환경변수가 설정되지 않았습니다' });
  }

  try {
    const { image, prompt, customerInfo } = req.body;
    // 로그에는 개인정보를 남기지 않는다 (개인정보보호법 · CLAUDE.md 6장).
    // 실명·나이·고민을 함께 남기면 특정 개인이 식별된다. 장애 추적은
    // Vercel이 요청마다 자동으로 붙이는 Request ID와 시각으로 충분하다.
    console.log('[analyze] 요청 수신 — 부위:', customerInfo?.label ?? '미지정',
      '| 이미지 포함:', !!image?.data,
      '| 이미지 크기(chars):', image?.data?.length ?? 0);

    const buildPrompt = (ci) => {
      // 실명은 분석에 쓰지 않으므로 이름 유무로 판단하지 않는다 (개인정보 최소수집)
      if (!ci) return null;

      // 종합 진단 합성 (이미지 없음, 전 부위 점수 기반 → JSON 반환)
      if (ci.purpose === 'diagnosis_synthesis') {
        const areas = Array.isArray(ci.perAreaScores) ? ci.perAreaScores : [];
        const areaLines = areas.map(a => {
          const d = a.detail || {};
          return `${a.label}: 수분${d['수분'] ?? '?'} 밀도${d['모발밀도'] ?? '?'} 모공${d['모공'] ?? '?'} 유분${d['유분'] ?? '?'} 민감도${d['민감도'] ?? '?'}`;
        }).join('\n');
        const avg = ci.avgScoreDetail || {};
        const avgLine = `전체 평균: 수분${avg['수분'] ?? '?'} 밀도${avg['모발밀도'] ?? '?'} 모공${avg['모공'] ?? '?'} 유분${avg['유분'] ?? '?'} 민감도${avg['민감도'] ?? '?'}`;
        const sorted = [...areas].sort((a, b) => (a.scalp_score ?? 50) - (b.scalp_score ?? 50));
        const lowestArea = sorted[0]?.label ?? '없음';
        const highestArea = sorted[sorted.length - 1]?.label ?? '없음';
        const system = `당신은 두피 종합 진단 전문가입니다.
전체 부위 측정 데이터를 보고 이 고객의 두피를 한 줄로 유형화하고
이 사람만의 패턴을 서술합니다.

[출력 형식 — JSON만 반환, 다른 텍스트 없이]
{
  "type_label": "건성 + 모공 불균형 복합형",
  "pattern": "정수리 수분(35점)이 후두부(52점)보다 낮고, 모공 균형이 전체 항목 중 가장 취약합니다. 이런 패턴은 두피 앞쪽에 피지와 각질이 집중되는 전형적인 전두부 집중형입니다.",
  "priority": "지금 가장 급한 건 모공 균형(30점)입니다. 주 2회 스케일링으로 앞머리 쪽 피지 균형부터 잡으세요."
}

[금지]
- type_label에 "복합형" 단독 사용 금지 — 반드시 구체적 특징 포함
- 모든 항목이 나쁘다는 과장 금지
- 일반론 금지`;
        const userText = `전체 측정 데이터:
${areaLines}
${avgLine}
가장 낮은 부위: ${lowestArea} / 가장 높은 부위: ${highestArea}`;
        return { system, userText };
      }

      // 제품 추천 합성 (이미지 없음, 평균 점수 기반)
      if (ci.purpose === 'product_synthesis') {
        const scoresText = ci.scoreDetail
          ? Object.entries(ci.scoreDetail).map(([k, v]) => `${k}: ${v}점`).join(' / ')
          : (ci.scalpScore != null ? `두피 종합 점수: ${ci.scalpScore}점` : '점수 없음');
        const concernsLine = (ci.hasIntakeData && ci.concerns)
          ? `고객이 직접 말한 고민: ${ci.concerns}`
          : `고객 문진 없음 — 측정 수치만으로 추천`;
        const noIntakeRule = !ci.hasIntakeData
          ? `\n고객 문진이 없으므로:\n- "탈모가 고민이신", "숱이 적으신" 같은 단정 표현 사용 금지\n- 대신 "측정된 수치 기준으로" / "지금 데이터에서 보이는 주요 특징은" 으로 시작`
          : '';
        return `당신은 두피 전문 클리닉의 진단사입니다.
오늘 측정한 두피 지표를 바탕으로 제품 추천만 작성해주세요.
${noIntakeRule}

[오늘 두피 측정 평균]
${scoresText}
두피 타입: ${ci.scalpType}
${concernsLine}

[시세이도 서브리믹 제품 추천 가이드]
제품 라인 및 핵심 성분:
- 아쿠아 인텐시브: 손상·건조 모발, 펌·염색 반복 고객
  핵심 성분: Quasi Cuticle Ingredient(큐티클 복구), Arginine(모발 내부 결합 복구), Hydrolyzed Silk(광택·코팅), Royal Jelly Extract(수분·강화)
- 루미노 포스: 염색 후 광택·컬러 유지
  핵심 성분: Arginine(멜라닌 홀 복구), Squalane(지질 보충), Sericin(실크 단백질·광택), Sodium Acetylated Hyaluronate(고보습)
- 에어리 플로우: 굵고 뻣뻣한·곱슬 모발
  핵심 성분: Macadamia Nut Fatty Acid Phytosteryl(유연성), Glyoxylic Acid(직모 효과), Hydroxyethyl Urea(보습·연화)
- 휀테포르테: 두피 트러블 전용
  건성용: Camellia Japonica Seed Oil(보습), Dipotassium Glycyrrhizate(진정)
  지성용: Menthol(혈행 촉진), Salicylic Acid(피지·각질 제거)
  비듬성용: Salicylic Acid BHA(각질·비듬 억제), Menthol(청량)
- 아데노바이탈: 탈모·가는 모발·볼륨 부족
  핵심 성분: Adenosine(모유두 세포 활성화, 일본 의약부외품 임상 검증), Niacinamide(두피 장벽 강화), Squalane(보습)

추천 매트릭스:
- 지성 두피 → 휀테포르테 지성용
- 건성 두피 → 휀테포르테 건성용 + 아쿠아 인텐시브
- 복합 두피 → 휀테포르테 (두피) + 아쿠아 인텐시브 (모발)
- 탈모·가는 모발 → 아데노바이탈 [최우선]
- 염색 후 → 루미노 포스
- 손상·펌·염색 반복 → 아쿠아 인텐시브
- 비듬·각질 → 휀테포르테 비듬성용
- 곱슬·뻣뻣한 → 에어리 플로우
추천 이유는 반드시 고객의 두피 상태와 핵심 성분을 직접 연결하세요.

아래 형식으로만 출력해주세요 (다른 내용 금지):

## 🛁 오늘의 제품 추천
(두피 타입·고민 종합해 1~2가지 추천. 2가지면 1순위/2순위 표시. 각 2~3문장. 명확한 매칭 없으면 섹션 전체 생략.)

한국어로 작성해주세요.`;
      }

      // 부위별 이미지(정수리·측두부·후두부)는 부위 분석만, 전체/기타는 풀 분석
      const AREA_ONLY = ['정수리', '측두부(좌)', '측두부(우)', '후두부'];
      const isAreaOnly = AREA_ONLY.includes(ci.label);

      if (isAreaOnly) {
        const prev = (ci.prevScoreDetail && typeof ci.prevScoreDetail === 'object' && !Array.isArray(ci.prevScoreDetail))
          ? ci.prevScoreDetail : null;
        const fmtScore = (key) => prev?.[key] != null ? `${prev[key]}점` : '미측정';
        // 지표 이름을 실제 값과 맞춘다. 예전에는 모발밀도를 "모공 밀도",
        // 유분을 "모공 균형", 민감도를 "탄력도"라고 잘못 붙여 보내고 있었다.
        // AI는 그 이름을 그대로 믿고 문장을 써서, 손님은 엉뚱한 항목 설명을 읽었다.
        const prevSection = prev
          ? `이전 방문 수치 (참고, 같은 기준으로 채점된 값):
수분: ${fmtScore('수분')}
모공 상태: ${fmtScore('모공')}
유분 균형: ${fmtScore('유분')}
민감도: ${fmtScore('민감도')}
모발 밀도: ${fmtScore('모발밀도')}`
          : '이전 방문 수치: 없음 (첫 측정)';
        const system = `당신은 두피 전문 분석가입니다. 고객의 두피 이미지를 보고 부위별 분석 텍스트를 작성합니다.

[필수 규칙]
- 모든 문장은 이미지에서 실제로 관찰한 것에서 출발해야 합니다
- 본인이 매긴 점수를 직접 인용하세요: "수분 52점은", "유분 균형 66점이"처럼
- 다른 사람이나 평균과 비교하지 마세요. 근거로 삼을 데이터가 없습니다.
  "평균보다 낮은", "평균 수준인", "또래보다" 같은 표현을 절대 쓰지 마세요.
- 비교가 필요하면 이전 방문 수치와만 비교하세요
- 일반론 금지: "두피 관리가 중요합니다" 같은 문장 사용 불가
- 항목 레이블("관찰:", "행동:") 없이 자연스러운 서술체로 작성

[출력 구조: 총 3~4문장]
문장1~2: 이미지에서 보이는 것 + 해당 부위 수치 직접 인용
문장3: 이 수치가 두피에 미치는 영향과 가능한 원인
문장4: 내일 당장 실천 가능한 구체적 행동 1가지


[점수 기준 v2 — 반드시 이 기준으로 채점할 것]
90~100 : 개선할 점을 찾기 어려움. 해당 항목에서 문제 신호가 보이지 않음
75~89  : 좋음. 눈에 띄는 문제 신호가 없고 상태가 안정적임
60~74  : 보통. 특별한 문제 신호는 없으며 지금처럼 유지하면 충분한 상태
45~59  : 관리 필요. 개선 여지가 눈에 띄게 보임
25~44  : 집중 관리 필요. 여러 신호가 함께 관찰됨
0~24   : 매우 취약

채점 규칙:
- 60점은 나쁜 상태가 아니라 보통이다. 문제 신호가 뚜렷하지 않은 일반적인 두피는 60~75 구간이다.
- 점수는 이미지에서 실제로 관찰되는 근거로만 판단한다.
- 다른 사람이나 평균과 비교하지 말 것. "또래 평균", "평균 대비", "상위 몇 %" 같은 비교 표현은
  근거로 삼을 데이터가 없으므로 채점에도 쓰지 말고 문장에도 쓰지 말 것.
- 5개 항목을 모두 비슷한 점수로 몰아주지 말 것. 항목마다 실제 상태가 다르면
  그 차이가 점수 폭으로 드러나야 한다. 좋은 항목은 확실히 높게, 취약한 항목은 확실히 낮게.
- 이미지로 판단이 어려운 항목은 임의로 낮게 주지 말고 60을 기준으로 두되,
  근거가 보이면 그때 올리거나 내릴 것.
- 안전하게 중간값을 주려 하지 말 것. 근거에 따라 판단한 점수를 그대로 쓸 것.

응답 맨 마지막에 반드시 아래 JSON 한 줄 출력 (설명 없이):
[SCORE]{"scalp_score":N,"detail":{"유분":N,"수분":N,"모공":N,"민감도":N,"모발밀도":N},"basis":{"유분":"근거","수분":"근거","모공":"근거","민감도":"근거","모발밀도":"근거"}}[/SCORE]

detail의 N은 각각 0~100 정수. 문장에서 인용한 수치와 반드시 일치할 것.
basis에는 각 점수를 그렇게 매긴 이유를 이미지에서 관찰한 사실로 15자 내외로 쓸 것.
- 좋은 예: "모공 주변 각질 다수 관찰", "모발 굵기 고르고 밀도 양호"
- 나쁜 예: "보통 수준입니다"(관찰 아님), "평균보다 낮음"(비교 금지)
사진에서 확인되지 않아 판단이 어려운 항목은 basis에 "사진으로 확인 어려움"이라고 쓸 것.
`;
        const userText = `부위: ${ci.label}
${prevSection}

이미지를 분석해 수치를 직접 판단하고, 그 수치를 3~4문장 분석 텍스트에 인용하세요.`;
        return { system, userText };
      }

      const prevMoistureStr = ci.prevMoisture != null ? `${ci.prevMoisture}점` : "미기재";
      const prevElasticityStr = ci.prevElasticity != null ? `${ci.prevElasticity}점` : "미기재";

      const sleepLbl = ci.sleep >= 70 ? '양호' : ci.sleep >= 50 ? '보통' : '부족';
      const stressLbl = ci.stress >= 70 ? '높음' : ci.stress >= 40 ? '보통' : '낮음';
      const sleepChg = ci.prevSleep != null
        ? ` / 지난 방문 ${ci.prevSleep}점 대비 ${ci.sleep > ci.prevSleep + 10 ? '개선' : ci.sleep < ci.prevSleep - 10 ? '악화' : '유사'}`
        : '';
      const stressChg = ci.prevStress != null
        ? ` / 지난 방문 ${ci.prevStress}점 대비 ${ci.stress < ci.prevStress - 10 ? '개선' : ci.stress > ci.prevStress + 10 ? '악화' : '유사'}`
        : '';

      return `당신은 두피 전문 클리닉의 진단사입니다.
아래 고객 정보와 두피 사진을 토대로, 신뢰감 있는 전문 소견을 작성해주세요.

[고객 정보]
- 나이: ${ci.age}세
- 수면 품질: ${sleepLbl} (${ci.sleep}/100${sleepChg})
- 스트레스 수준: ${stressLbl} (${ci.stress}/100${stressChg}) ← 높을수록 스트레스 많음
- 두피 고민: ${ci.concerns}
- 평소 두피 타입: ${ci.scalpType}
- 샴푸 주기: ${ci.shampooFreq}
- 이전 방문 수분도: ${prevMoistureStr}
- 이전 방문 탄력도: ${prevElasticityStr}
${ci.visit_type === "revisit" ? `
[재방문 정보]
- 두피 변화 느낌: ${ci.scalp_change}
- 지난번 추천 실천: ${ci.action_taken}
- 실천 효과: ${ci.action_effect ?? "미응답"}
` : ''}
[작성 원칙]
- 위 [고객 정보]의 수면 품질·스트레스 수치를 내러티브에서 반드시 그대로 인용. 다른 수치 절대 사용 금지.
- "~습니다", "~입니다" 기반으로, "~어요"를 자연스럽게 혼용
- "~거든요", "~해보세요" 같은 과도한 친근함 금지
- "위험", "악화", "심각" 같은 겁주는 표현 금지
- 개선 예상에 표·퍼센트 수치 금지
- 제품 성분명 나열 금지, 생활 습관 중심
- 문장 구조: 관찰·근거 한 줄 → 결론·권장 행동 한 줄
- "~할 수 있을 것입니다", "~경험을 하실 수 있을 것입니다" 같은 이중 추측 표현 금지
- 전체 응답 최대 800자
- 🔍 지금 신경 쓸 부분: 2가지, 각각 2~3문장 (수치 인용 필수)
- 💆 이렇게 해보세요: 2가지, 각각 1문장
- 📈 관리 포인트: 1~2문장
- 🛁 오늘의 제품 추천: 1~2가지, 각각 2~3문장
- 불필요한 배경 설명, 반복, 부연 설명 절대 금지
- 본문의 수치는 반드시 응답 마지막 [SCORE] detail 값과 일치할 것
- "샴푸 주기를 격일로 조정하세요" 같은 비현실적 권유 절대 금지
- 한국인은 매일 샴푸가 일반적임을 전제로 작성
- 대신 아래 현실적 행동 중심으로 권유:
  ✅ 샴푸 시 두피 마사지 30초 추가
  ✅ 샴푸 후 두피 완전 건조 (드라이어 찬바람)
  ✅ 저자극·두피 전용 샴푸로 교체
  ✅ 취침 전 두피 오일 or 세럼 1~2방울
  ✅ 베개 커버 주 1회 교체
  ✅ 머리 감은 후 두피 먼저 말리기
- 고객이 내일 당장 실천할 수 있는 행동만 권유
- "~해보세요" 보다 "~하시면 됩니다" 톤으로
${ci.visit_type === "revisit" ? `- 재방문 고객이므로 지난 방문과의 변화를 반드시 언급
- action_taken이 "못 했어요"면 부담 없이 격려하는 톤으로
- action_taken이 실천했으면 구체적인 효과와 연결해서 칭찬하는 톤으로` : ''}

[참고 예시 톤]
"두피 수분도가 많이 낮아진 상태입니다. 샴푸 후 두피를 완전히 건조하지 않으면 장벽이 더 약해질 수 있어요. 드라이어 찬바람으로 두피를 먼저 말리시면 됩니다."

[시세이도 서브리믹 제품 추천 가이드]
제품 라인 및 핵심 성분:
- 아쿠아 인텐시브: 손상·건조 모발, 펌·염색 반복 고객
  - 핵심 성분: Quasi Cuticle Ingredient(큐티클 복구), Arginine(모발 내부 결합 복구), Hydrolyzed Silk(광택·코팅), Royal Jelly Extract(수분·강화), Thiotaurine(항산화)

- 루미노 포스: 염색 후 광택·컬러 유지
  - 핵심 성분: Arginine(멜라닌 홀 복구), Squalane(지질 보충·보습), Sericin(실크 단백질·광택), Sodium Acetylated Hyaluronate(고보습), Thiotaurine(항산화·컬러 보호)

- 에어리 플로우: 굵고 뻣뻣한·곱슬 모발
  - 핵심 성분: Macadamia Nut Fatty Acid Phytosteryl(모발 유연성), Polyquaternium-51(습기 차단), Glyoxylic Acid(모발 재형성·직모 효과), Hydroxyethyl Urea(보습·연화)

- 휀테포르테: 두피 트러블 전용
  - 건성용: Camellia Japonica Seed Oil(동백 오일·보습), Dipotassium Glycyrrhizate(감초·진정), Arginine(두피 환경 개선)
  - 지성용: Menthol(청량감·혈행 촉진), Salicylic Acid(피지·각질 제거), Sasa Veitchii Extract(두피 진정)
  - 비듬성용: Salicylic Acid BHA(각질·비듬 억제), Menthol(청량), Ononis Spinosa Root Extract(두피 케어)

- 아데노바이탈: 탈모·가는 모발·볼륨 부족
  - 핵심 성분: Adenosine(모유두 세포 직접 작용·성장 인자 활성화, 일본 의약부외품 임상 검증), Humulus Lupulus Flower Extract(홉·두피 혈행 촉진), Niacinamide(두피 장벽 강화), Squalane(두피·모발 보습)

추천 매트릭스 (두피 타입·고민 기준):
- 지성 두피 → 휀테포르테 (지성용)
- 건성 두피 → 휀테포르테 (건성용) + 아쿠아 인텐시브
- 복합 두피 → 휀테포르테 (두피) + 아쿠아 인텐시브 (모발)
- 탈모·가는 모발·볼륨 부족 → 아데노바이탈 [최우선 적용]
- 염색 후 색상·광택 유지 → 루미노 포스
- 손상·끊어짐·펌·염색 반복 → 아쿠아 인텐시브
- 비듬·각질 → 휀테포르테 (비듬성용)
- 곱슬·굵고 뻣뻣한 모발 → 에어리 플로우
추천 이유는 반드시 고객의 현재 두피·모발 상태와 핵심 성분을 직접 연결하세요.
명확한 매칭이 없으면 🛁 섹션 전체를 생략하세요.

아래 형식으로 작성해주세요:

## 두피 분석

## 🔬 두피 타입 & 지형
(두피 타입 판단 1문장)
(이 고객의 가장 낮은 항목과 가장 높은 항목 대비 — 예: "수분이 낮고(XX점) 유분이 높은(XX점) 건 ○○ 패턴입니다" 형식으로 수치 인용 1문장)

## 🔍 지금 신경 쓸 부분
1. [가장 취약한 항목명 XX점]: 이 수치가 의미하는 것 → 원인 추정 → 구체적 행동. 2~3문장.
2. [두 번째 취약 항목명 XX점]: 동일 구조. 2~3문장.

## 💆 이렇게 해보세요
1. (내일 당장 가능한 행동 + 이유 1문장)
2. (내일 당장 가능한 행동 + 이유 1문장)

## 📈 관리 포인트
(가장 중요한 지표 수치 인용 + 4~6주 목표 — 1~2문장. "~달라집니다"처럼 자신감 있게 마무리.)

## 🛁 오늘의 제품 추천
(두피 타입·주요 고민을 종합해 시세이도 서브리믹 라인 중 1~2가지 추천.
 2가지 추천 시 1순위/2순위로 표시. 명확한 근거 없으면 이 섹션 전체 생략.)
예시:
"1순위: 아데노바이탈
— Adenosine이 모유두 세포에 직접 작용해 성장 인자를 활성화합니다. 정수리 모발이 가늘어지고 있는 지금, 임상 검증된 성분으로 모낭 활성화를 시작하는 것이 중요합니다.

2순위: 휀테포르테 (지성용)
— Salicylic Acid(BHA)가 두피 피지와 각질을 제거하고, Menthol이 두피 혈행을 촉진합니다. 피지 분비가 많은 두피 환경을 안정화하는 데 도움이 됩니다."

분석 부위: [${ci.label}]
${(ci.prevMoisture != null || ci.prevElasticity != null) ? '이전 방문 데이터가 있다면 지표 변화를 간략히 언급해주세요.' : ''}
한국어로 작성해주세요.

---

[점수 기준 v2 — 반드시 이 기준으로 채점할 것]
90~100 : 개선할 점을 찾기 어려움. 해당 항목에서 문제 신호가 보이지 않음
75~89  : 좋음. 눈에 띄는 문제 신호가 없고 상태가 안정적임
60~74  : 보통. 특별한 문제 신호는 없으며 지금처럼 유지하면 충분한 상태
45~59  : 관리 필요. 개선 여지가 눈에 띄게 보임
25~44  : 집중 관리 필요. 여러 신호가 함께 관찰됨
0~24   : 매우 취약

채점 규칙:
- 60점은 나쁜 상태가 아니라 보통이다. 문제 신호가 뚜렷하지 않은 일반적인 두피는 60~75 구간이다.
- 점수는 이미지에서 실제로 관찰되는 근거로만 판단한다.
- 다른 사람이나 평균과 비교하지 말 것. "또래 평균", "평균 대비", "상위 몇 %" 같은 비교 표현은
  근거로 삼을 데이터가 없으므로 채점에도 쓰지 말고 문장에도 쓰지 말 것.
- 5개 항목을 모두 비슷한 점수로 몰아주지 말 것. 항목마다 실제 상태가 다르면
  그 차이가 점수 폭으로 드러나야 한다. 좋은 항목은 확실히 높게, 취약한 항목은 확실히 낮게.
- 이미지로 판단이 어려운 항목은 임의로 낮게 주지 말고 60을 기준으로 두되,
  근거가 보이면 그때 올리거나 내릴 것.
- 안전하게 중간값을 주려 하지 말 것. 근거에 따라 판단한 점수를 그대로 쓸 것.

응답 맨 마지막에 반드시 아래 JSON 한 줄 출력 (설명 없이):
[SCORE]{"scalp_score":N,"detail":{"유분":N,"수분":N,"모공":N,"민감도":N,"모발밀도":N},"basis":{"유분":"근거","수분":"근거","모공":"근거","민감도":"근거","모발밀도":"근거"}}[/SCORE]

detail의 N은 각각 0~100 정수. 문장에서 인용한 수치와 반드시 일치할 것.
basis에는 각 점수를 그렇게 매긴 이유를 이미지에서 관찰한 사실로 15자 내외로 쓸 것.
- 좋은 예: "모공 주변 각질 다수 관찰", "모발 굵기 고르고 밀도 양호"
- 나쁜 예: "보통 수준입니다"(관찰 아님), "평균보다 낮음"(비교 금지)
사진에서 확인되지 않아 판단이 어려운 항목은 basis에 "사진으로 확인 어려움"이라고 쓸 것.
`;
    };

    // purpose 또는 concerns 필드가 있으면 buildPrompt 호출 (synthesis 포함)
    const promptResult = (
      (customerInfo?.purpose !== undefined || customerInfo?.concerns !== undefined)
        ? buildPrompt(customerInfo)
        : null
    ) || prompt || `두피 전문 AI. 고객의 두피 이미지를 분석해주세요. 한국어로 응답.`;

    // buildPrompt가 { system, userText } 객체 or 문자열을 반환
    let systemText = null;
    let userText;
    if (promptResult && typeof promptResult === 'object' && typeof promptResult.userText === 'string') {
      systemText = promptResult.system || null;
      userText = promptResult.userText;
    } else {
      userText = String(promptResult);
    }

    const content = [];
    if (image && image.data) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: image.mimeType || 'image/jpeg', data: image.data },
      });
    }
    content.push({
      type: 'text',
      text: userText,
    });

    // 재시도 대상: 429 (rate limit), 529 (overloaded)
    const RETRYABLE = new Set([429, 529]);
    const RETRY_DELAYS = [5000, 10000]; // 1차 5초, 2차 10초

    // Opus 5는 기본으로 사고(thinking)를 하며, 사고 과정도 출력 토큰을 쓴다.
    // effort 'low' + 넉넉한 max_tokens = 품질은 올리고 30초 벽은 넘지 않는 조합.
    const MODEL = 'claude-opus-5';
    const anthropicBodyObj = {
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content }],
    };
    if (systemText) anthropicBodyObj.system = systemText;
    const anthropicBody = JSON.stringify(anthropicBodyObj);

    // 재시도까지 포함한 전체 예산. vercel.json maxDuration(60초) 안에 반드시 응답을 돌려줘야
    // 고객에게 흰 화면 대신 안내 메시지가 간다.
    const DEADLINE = Date.now() + 55000;

    let response;
    let attempt = 0;

    while (true) {
      // 남은 예산만큼만 기다린다
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.max(5000, DEADLINE - Date.now()));

      console.log(`[analyze] Anthropic API 호출 — attempt ${attempt + 1}/3, model: ${MODEL}`);
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: anthropicBody,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      console.log(`[analyze] Anthropic 응답 상태: ${response.status} (attempt ${attempt + 1})`);

      if (!RETRYABLE.has(response.status)) break; // 성공 또는 비재시도 오류

      if (attempt >= 2) break; // 최대 재시도 소진

      // 남은 시간이 부족하면 재시도해봐야 Vercel이 함수를 죽인다 — 바로 안내 메시지로 넘긴다
      if (DEADLINE - Date.now() < RETRY_DELAYS[attempt] + 10000) {
        console.warn("[analyze] 남은 시간 부족 — 재시도 생략");
        break;
      }

      const delay = RETRY_DELAYS[attempt];
      console.log(`[analyze] ${response.status} 오류 — ${delay / 1000}초 후 재시도 (${attempt + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }

    // 재시도 후에도 429/529면 친화적 메시지 반환
    if (RETRYABLE.has(response.status)) {
      console.error(`[analyze] ${response.status} — 2회 재시도 후에도 실패`);
      return res.status(503).json({ error: '일시적으로 분석이 지연되고 있어요. 잠시 후 다시 시도해주세요.' });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[analyze] Anthropic 오류:', response.status, errText);
      let errJson;
      try { errJson = JSON.parse(errText); } catch { errJson = { raw: errText }; }
      return res.status(response.status).json({
        error: `Anthropic 오류 ${response.status}`,
        detail: errJson,
      });
    }

    const data = await response.json();

    // Opus 5는 사고(thinking) 블록을 먼저 내보내므로 content[0]이 더 이상 분석 텍스트가 아니다.
    // type이 'text'인 블록만 골라 이어붙여야 한다.
    const resultText = (data.content ?? [])
      .filter(block => block?.type === 'text')
      .map(block => block.text)
      .join('');

    // 안전 분류기가 분석을 거절한 경우 (사진 문제 등) — 고객에게는 재촬영을 안내한다
    if (data.stop_reason === 'refusal') {
      console.error('[analyze] 모델이 분석을 거절함:', data.stop_details?.category ?? 'unknown');
      return res.status(422).json({ error: '이 사진은 분석할 수 없어요. 다시 촬영해주세요.' });
    }

    if (!resultText.trim()) {
      console.error('[analyze] 텍스트 블록 없음 — stop_reason:', data.stop_reason);
      return res.status(502).json({ error: '분석 결과를 받지 못했어요. 다시 시도해주세요.' });
    }

    if (data.stop_reason === 'max_tokens') {
      console.warn('[analyze] max_tokens 도달 — 응답이 잘렸을 수 있음');
    }

    const scoreData = parseScalpScore(resultText);
    if (!scoreData) {
      console.warn('[analyze] scalp_score 없음 — null로 저장됨');
    }
    const cleanText = resultText.replace(/\[SCORE\][\s\S]*?\[\/SCORE\]/, '').trimEnd();
    console.log('[analyze] 분석 완료 — 응답 길이:', resultText.length, 'chars | scalp_score:', scoreData?.scalp_score ?? 'null');
    return res.status(200).json({
      result: cleanText,
      scalp_score: scoreData?.scalp_score ?? null,
      score_detail: scoreData?.score_detail ?? null,
      score_basis: scoreData?.score_basis ?? null,
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[analyze] 타임아웃 (50초 초과)');
      return res.status(504).json({ error: '분석이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' });
    }
    console.error('[analyze] 예외:', error.name, error.message);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
