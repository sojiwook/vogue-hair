export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image, customerInfo } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mimeType || 'image/jpeg',
                data: image.data,
              }
            },
            {
              type: 'text',
              text: `두피 전문 AI입니다. [${customerInfo.label}] 두피 이미지를 분석해주세요.
고객: ${customerInfo.name}님 (${customerInfo.age}세)

**🔬 두피 타입** (판정+근거 1문장)
**📊 주요 지표**
- 모공 청결도: XX/100
- 두피 수분도: XX/100
- 피지 분비량: XX/100
- 모낭 건강도: XX/100
- 염증·자극: XX/100
**🚨 주의 소견** (2~3개)
**💆 추천 케어** (2가지)
**📈 개선 예상**

각 섹션 3줄 이내, 한국어로.`
            }
          ]
        }]
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.content[0].text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}