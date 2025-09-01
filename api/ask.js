// api/ask.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: "Missing concept" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are AstroLens, an astrophysics explainer. Respond in JSON with keys: beginner, intermediate, advanced, visualization (object with type), applications, optionally image_url."
        },
        {
          role: "user",
          content: `Explain the concept: ${concept}. Include a short beginner explanation, intermediate explanation, advanced explanation, applications, visualization description, and optionally an image_url relevant to the concept.`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    let output;
    try {
      output = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      // fallback: return raw text in all fields if parse fails
      output = {
        beginner: completion.choices[0].message.content,
        intermediate: completion.choices[0].message.content,
        advanced: completion.choices[0].message.content,
        applications: completion.choices[0].message.content,
        visualization: { type: "generic" },
        image_url: null
      };
    }

    res.status(200).json(output);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
