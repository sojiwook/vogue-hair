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
      return `당신은 20년 경력의 두피 전문 진단사입니다.
아래 고객 정보와 두피 사진을 보고, 고객에게 직접 이야기하듯 따뜻하고 솔직하게 진단 소견을 써주세요.

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
- "~거든요", "~해보세요", "~있어요" 같은 자연스러운 존댓말 사용
- "~됩니다", "~입니다" 같은 딱딱한 표현 금지
- "위험", "악화", "심각" 같은 겁주는 표현 금지, 배려의 톤으로
- 개선 예상에 표·퍼센트 수치 금지
- 제품 성분명 나열 금지, 생활 습관 중심으로
- 각 섹션은 2~3문장 이내로 간결하게

[참고 예시 톤]
"두피를 보니까 지성 쪽으로 많이 기울어져 있어요. 매일 샴푸하시는 게 오히려 두피를 더 건조하게 만들고 있는 거거든요. 격일로 바꿔보시는 게 가장 먼저 해야 할 것 같아요."

아래 형식으로 작성해주세요:

## 두피 분석 - ${ci.name}님

## 🔬 두피 타입
(사진과 고객 정보를 종합, 2~3문장)

## 📊 주요 지표
- 두피 수분도: XX/100
- 모낭 건강도: XX/100

## 🔍 지금 신경 쓸 부분
(2가지, 배려 있는 톤으로)

## 💆 이렇게 해보세요
(2~3가지, 샴푸 주기·생활 습관 중심, 구체적으로)

## 📈 앞으로는요
(한두 문장. "꾸준히 관리하시면 보통 4주 안에 차이를 느끼실 수 있어요. 지금은 XX가 제일 중요해요." 형식으로)

분석 부위: [${ci.label}]
${(ci.prevMoisture != null || ci.prevElasticity != null) ? '이전 방문 데이터가 있다면 자연스럽게 변화를 언급해주세요.' : ''}
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
