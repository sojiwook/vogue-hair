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
    console.log('[analyze] 요청 수신 — customer:', customerInfo?.name,
      '| 이미지 포함:', !!image?.data,
      '| 이미지 크기(chars):', image?.data?.length ?? 0);

    const content = [];
    if (image && image.data) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: image.mimeType || 'image/jpeg', data: image.data },
      });
    }
    content.push({
      type: 'text',
      text: prompt || `두피 전문 AI. ${customerInfo?.name}님의 두피 이미지를 분석해주세요. 한국어로 응답.`,
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
          max_tokens: 1024,
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
