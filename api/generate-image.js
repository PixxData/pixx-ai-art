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
    // Request two images separately
    const getImage = async () => {
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          model: "dall-e-3",
          prompt,
          n: 1, // DALL·E 3 only allows 1 at a time
          size
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          }
        }
      );
      return response.data.data?.[0]?.url;
    };

    // Generate 2 images (sequentially)
    const images = [];
    for (let i = 0; i < 2; i++) {
      const url = await getImage();
      if (url) images.push(url);
    }

    if (!images.length) {
      res.status(500).json({ error: "No image returned from OpenAI" });
      return;
    }
    res.status(200).json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
