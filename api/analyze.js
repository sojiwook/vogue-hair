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
    console.log('[analyze] 요청 수신 — customer:', customerInfo?.name, customerInfo?.age,
      '| concerns:', customerInfo?.concerns,
      '| 이미지 포함:', !!image?.data,
      '| 이미지 크기(chars):', image?.data?.length ?? 0);

    const buildPrompt = (ci) => {
      if (!ci?.name) return null;
      const prevMoistureStr = ci.prevMoisture != null ? `${ci.prevMoisture}점` : "미기재";
      const prevElasticityStr = ci.prevElasticity != null ? `${ci.prevElasticity}점` : "미기재";
      return `당신은 두피 전문 클리닉의 진단사입니다.
아래 고객 정보와 두피 사진을 토대로, 신뢰감 있는 전문 소견을 작성해주세요.

[고객 정보]
- 이름: ${ci.name} (${ci.age}세)
- 수면 품질: ${ci.sleep}/100
- 스트레스 지수: ${ci.stress}/100
- 두피 고민: ${ci.concerns}
- 평소 두피 타입: ${ci.scalpType}
- 샴푸 주기: ${ci.shampooFreq}
- 이전 방문 수분도: ${prevMoistureStr}
- 이전 방문 탄력도: ${prevElasticityStr}

[작성 원칙]
- "~습니다", "~입니다" 기반으로, "~어요"를 자연스럽게 혼용
- "~거든요", "~해보세요" 같은 과도한 친근함 금지
- "위험", "악화", "심각" 같은 겁주는 표현 금지
- 개선 예상에 표·퍼센트 수치 금지
- 제품 성분명 나열 금지, 생활 습관 중심
- 문장 구조: 관찰·근거 한 줄 → 결론·권장 행동 한 줄
- "~할 수 있을 것입니다", "~경험을 하실 수 있을 것입니다" 같은 이중 추측 표현 금지
- 각 섹션 2~3문장 이내

[참고 예시 톤]
"두피 수분도가 많이 낮아진 상태입니다. 매일 샴푸가 두피 장벽을 약하게 만들고 있어요. 샴푸 주기를 격일로 조정하는 것이 지금 가장 중요합니다."

[시세이도 서브리믹 제품 추천 가이드]
제품 라인:
• 아쿠아 인텐시브: 손상·건조 모발, 펌·염색 반복 고객
• 루미노 포스: 염색 후 광택·컬러 유지
• 에어리 플로우: 굵고 뻣뻣한·곱슬 모발
• 휀테포르테: 두피 트러블 전용 (건성용/지성용/비듬성용 구분)
• 아데노바이탈: 탈모·가는 모발·볼륨 부족

추천 매트릭스 (두피 타입·고민 기준):
- 지성 두피 → 휀테포르테 (지성용)
- 건성 두피 → 휀테포르테 (건성용) + 아쿠아 인텐시브
- 복합 두피 → 휀테포르테 (두피) + 아쿠아 인텐시브 (모발)
- 탈모·가는 모발·볼륨 부족 → 아데노바이탈 [최우선 적용]
- 염색 후 색상·광택 유지 → 루미노 포스
- 손상·끊어짐·펌·염색 반복 → 아쿠아 인텐시브
- 비듬·각질 → 휀테포르테 (비듬성용)
- 곱슬·굵고 뻣뻣한 모발 → 에어리 플로우
추천 이유는 반드시 고객의 현재 두피·모발 상태와 직접 연결하세요.
명확한 매칭이 없으면 🛁 섹션 전체를 생략하세요.

아래 형식으로 작성해주세요:

## 두피 분석 - ${ci.name}님

## 🔬 두피 타입
(사진 근거 한 문장 + 두피 타입 판단 한 문장)

## 📊 주요 지표
- 두피 수분도: XX/100
- 모낭 건강도: XX/100

## 🔍 지금 신경 쓸 부분
(2가지. 각각 원인 → 결과 → 권장 행동 순서로)

## 💆 이렇게 해보세요
(2가지. 구체적 행동과 이유 한 줄씩)

## 📈 관리 포인트
(한두 문장. "~달라집니다", "~됩니다"처럼 자신감 있게 마무리. 이중 추측 표현 금지.
예시: "4~6주 꾸준히 관리하시면 두피 상태가 분명히 달라집니다. 지금 가장 중요한 건 샴푸 주기 조정입니다.")

## 🛁 오늘의 제품 추천
(두피 타입·주요 고민을 종합해 시세이도 서브리믹 라인 중 1~2가지 추천.
 2가지 추천 시 1순위/2순위로 표시. 명확한 근거 없으면 이 섹션 전체 생략.)
예시: "1순위: 아데노바이탈 — 현재 모발이 가늘어지는 상태여서 두피 세포 활성화 케어가 필요합니다."

분석 부위: [${ci.label}]
${(ci.prevMoisture != null || ci.prevElasticity != null) ? '이전 방문 데이터가 있다면 지표 변화를 간략히 언급해주세요.' : ''}
한국어로 작성해주세요.`;
    };

    // concerns가 있으면 풀 개인화 프롬프트, 없으면 기존 prompt 또는 기본값 사용
    const finalPrompt = (customerInfo?.concerns !== undefined ? buildPrompt(customerInfo) : null)
      || prompt
      || `두피 전문 AI. ${customerInfo?.name}님의 두피 이미지를 분석해주세요. 한국어로 응답.`;

    const content = [];
    if (image && image.data) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: image.mimeType || 'image/jpeg', data: image.data },
      });
    }
    content.push({
      type: 'text',
      text: finalPrompt,
    });

    // 25초 타임아웃 (vercel.json maxDuration: 30 과 맞춤)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    console.log('[analyze] Anthropic API 호출 시작 — model: claude-haiku-4-5-20251001');
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{ role: 'user', content }],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('[analyze] Anthropic 응답 상태:', response.status);

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
    const resultText = data.content?.[0]?.text ?? '';
    console.log('[analyze] 분석 완료 — 응답 길이:', resultText.length, 'chars');
    return res.status(200).json({ result: resultText });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[analyze] 타임아웃 (25초 초과)');
      return res.status(504).json({ error: 'AI 분석 시간 초과 (25초). 이미지를 줄이거나 다시 시도해주세요.' });
    }
    console.error('[analyze] 예외:', error.name, error.message);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
