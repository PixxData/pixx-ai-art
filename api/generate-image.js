import axios from "axios";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Use default to 4 images if n not supplied
  const { prompt, size = "1024x1024", n = 4 } = req.body;
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
        n,         // <---- Pass n (number of images) from client
        size
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        }
      }
    );

    // Map the returned images to URLs
    const images = (response.data.data || []).map(obj => obj.url).filter(Boolean);
    if (!images.length) {
      res.status(500).json({ error: "No images returned from OpenAI" });
      return;
    }
    res.status(200).json({ images }); // <---- Send as array!
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
