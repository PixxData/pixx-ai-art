import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt, size = "1024x1024" } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "API key not set" });
    return;
  }
  if (!prompt || prompt.length < 4) {
    res.status(400).json({ error: "Prompt is too short." });
    return;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-3",
        prompt,
        n: 1,          // <<<<<< ONLY 1 ALLOWED FOR DALL-E 3
        size
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        }
      }
    );

    const imageUrl = response.data.data?.[0]?.url;
    if (!imageUrl) {
      res.status(500).json({ error: "No image returned from OpenAI" });
      return;
    }
    res.status(200).json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
