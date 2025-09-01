// api/ask.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { concept, prefer_image_source } = req.body;
  
      // Call OpenAI (using Vercel env variable)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are AstroLens, an astrophysics/space explainer. Respond in structured JSON with keys: beginner, intermediate, advanced, applications, visualization (object with {type}), and optionally image_url."
            },
            {
              role: "user",
              content: `Explain the concept: ${concept}. Prefer image source: ${prefer_image_source}`
            }
          ],
          temperature: 0.7
        })
      });
  
      const data = await response.json();
  
      // Parse assistant message as JSON
      let output;
      try {
        output = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        output = { beginner: "Parse error", error: data };
      }
  
      res.status(200).json(output);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }  