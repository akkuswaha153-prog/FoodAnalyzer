export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    // Extract mediaType and pure base64 data
    let mediaType = 'image/jpeg';
    let imageData = imageBase64;

    if (imageBase64.includes('base64,')) {
      const parts = imageBase64.split('base64,');
      imageData = parts[1];
      const typePart = parts[0];
      if (typePart.includes('image/png')) mediaType = 'image/png';
      else if (typePart.includes('image/webp')) mediaType = 'image/webp';
      else if (typePart.includes('image/gif')) mediaType = 'image/gif';
      else mediaType = 'image/jpeg';
    }

    const prompt = `You are a professional nutritionist. Analyze this food image carefully and provide accurate nutritional data per 100g serving.

Respond ONLY with this exact JSON format, no other text:
{
  "name": "Exact Food Name",
  "emoji": "🍎",
  "calories": 52,
  "protein": 0.3,
  "carbs": 14.0,
  "fat": 0.2,
  "fiber": 2.4,
  "vitamins": ["Vitamin C", "Vitamin A", "Potassium", "Folate"],
  "ingredients": ["main ingredient 1", "component 2", "component 3", "component 4"],
  "benefits": [
    {"icon": "❤️", "t": "Heart Health", "d": "Specific benefit description"},
    {"icon": "💪", "t": "Muscle Support", "d": "Specific benefit description"},
    {"icon": "🧬", "t": "Antioxidants", "d": "Specific benefit description"},
    {"icon": "⚡", "t": "Energy Boost", "d": "Specific benefit description"},
    {"icon": "🛡️", "t": "Immunity", "d": "Specific benefit description"}
  ],
  "sideEffects": [
    "Side effect or caution 1",
    "Side effect or caution 2"
  ],
  "confidence": "High"
}

RULES:
- Identify the EXACT food in the image
- Give REALISTIC nutritional values per 100g
- Return ONLY valid JSON, nothing else`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Claude API error:', responseText);
      return res.status(response.status).json({
        error: 'Claude API error: ' + responseText
      });
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return res.status(500).json({ error: 'No JSON in AI response' });
    }

    const nutrition = JSON.parse(jsonMatch[0]);
    nutrition.isAI = true;

    return res.status(200).json(nutrition);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
