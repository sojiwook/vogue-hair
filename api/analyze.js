export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image, prompt, customerInfo } = req.body;

    const content = [];
    
    if (image && image.data) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: image.mimeType || 'image/jpeg', data: image.data }
      });
    }
    
    content.push({ type: 'text', text: prompt || `Scalp expert AI. Analyze scalp image for ${customerInfo?.name}. Respond in Korean.` });

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
        messages: [{ role: 'user', content }]
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: JSON.stringify(err) });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.content[0].text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}