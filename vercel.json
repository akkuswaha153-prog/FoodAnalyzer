// ================================================================
// VERCEL SERVERLESS FUNCTION - /api/analyze
// API key stays here on server - NEVER exposed to browser
// ================================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers - allow your app to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // ✅ API key safely stored in Vercel Environment Variable
    // Set this in Vercel Dashboard → Settings → Environment Variables
    // Name: OPENROUTER_API_KEY
    // Value: sk-or-v1-xxxxxxxxxx
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const model = 'google/gemini-2.0-flash-exp:free';

    const prompt = `You are a professional nutritionist. Analyze this food image and provide nutritional data per 100g serving. Respond ONLY with valid JSON, no other text, no markdown:
{"name":"Food Name","emoji":"🍎","calories":100,"protein":2.5,"carbs":20.0,"fat":1.2,"fiber":3.1,"vitamins":["Vitamin C","Potassium"],"ingredients":["ingredient 1","ingredient 2","ingredient 3","ingredient 4"],"benefits":[{"icon":"❤️","t":"Heart Health","d":"Brief benefit"},{"icon":"💪","t":"Muscle Support","d":"Brief benefit"},{"icon":"🧬","t":"Antioxidants","d":"Brief benefit"},{"icon":"⚡","t":"Energy","d":"Brief benefit"}],"sideEffects":["Side effect if consumed in excess","Another consideration"],"confidence":"High"}
IMPORTANT: Return ONLY the JSON object. Values should be realistic nutritional estimates per 100g.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nutriscan-ai.vercel.app',
        'X-Title': 'NutriScan AI'
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }],
        max_tokens: 800,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ 
        error: errData.error?.message || 'OpenRouter API error' 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response
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
