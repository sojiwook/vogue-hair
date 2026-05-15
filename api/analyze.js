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
      return `당신은 전문 두피 진단사입니다.
아래 고객 정보와 두피 사진을 함께 분석해서
개인화된 두피 리포트를 작성해주세요.

[고객 정보]
- 이름: ${ci.name} (${ci.age}세)
- 수면 품질: ${ci.sleep}/100 (높을수록 좋음)
- 스트레스 지수: ${ci.stress}/100 (높을수록 나쁨)
- 두피 고민: ${ci.concerns}
- 평소 두피 타입: ${ci.scalpType}
- 샴푸 주기: ${ci.shampooFreq}
- 이전 방문 수분도: ${prevMoistureStr}
- 이전 방문 탄력도: ${prevElasticityStr}

[분석 요청]
위 고객 정보를 반드시 반영해서 분석해줘.
특히 수면 부족이나 스트레스가 두피에 미치는 영향을 설명해줘.
이전 방문 데이터가 있으면 변화 추이도 언급해줘.

아래 형식으로 작성해줘:
## 두피 분석 리포트 - ${ci.name}님 (${ci.age}세)

## 🔬 두피 타입
(사진과 고객 정보를 종합한 두피 타입 판단)

## 📊 주요 지표
- 모공 청결도: XX/100
- 두피 수분도: XX/100
- 피지 분비량: XX/100
- 모낭 건강도: XX/100
- 염증·자극: XX/100

## 🚨 주의 소견
(고객 수면/스트레스 상태를 반영한 소견)

## 💆 추천 케어
(고객 두피 고민과 샴푸 주기를 반영한 맞춤 케어)

## 📈 개선 예상
(이전 데이터 있으면 비교, 없으면 초기 기준 예상)

분석 부위: [${ci.label}]
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
