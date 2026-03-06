export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Base64 se mediaType aur data alag karo
    const matches = imageBase64.match(
      /^data:([A-Za-z-+\/]+);base64,(.+)$/
    );

    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const mediaType = matches[1];
    const imageData = matches[2];

    const prompt = `You are a professional nutritionist. Analyze this food image and provide nutritional data per 100g serving. Respond ONLY with valid JSON, no other text, no markdown:
{"name":"Food Name","emoji":"🍎","calories":100,"protein":2.5,"carbs":20.0,"fat":1.2,"fiber":3.1,"vitamins":["Vitamin C","Potassium"],"ingredients":["ingredient 1","ingredient 2","ingredient 3","ingredient 4"],"benefits":[{"icon":"❤️","t":"Heart Health","d":"Brief benefit"},{"icon":"💪","t":"Muscle Support","d":"Brief benefit"},{"icon":"🧬","t":"Antioxidants","d":"Brief benefit"},{"icon":"⚡","t":"Energy","d":"Brief benefit"}],"sideEffects":["Side effect if consumed in excess","Another consideration"],"confidence":"High"}
IMPORTANT: Return ONLY the JSON object. Values should be realistic nutritional estimates per 100g.`;

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

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({
        error: errData.error?.message || 'Claude API error'
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No JSON in AI response' });
    }

    const nutrition = JSON.parse(jsonMatch[0]);
    nutrition.isAI = true;

    return res.status(200).json(nutrition);

  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
