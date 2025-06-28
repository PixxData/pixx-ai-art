const axios = require('axios');

async function handler(event) {
  console.log("Function started!");
  console.log("ENV API KEY:", process.env.OPENAI_API_KEY ? "SET" : "MISSING");

  let prompt = "A cat riding a bicycle"; // Hardcoded for now

  try {
    console.log("About to POST to OpenAI image API with axios...");

    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      }
    );

    console.log("Axios fetch completed!");
    const data = response.data;
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No image returned from OpenAI", data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl }),
      headers: { "Content-Type": "application/json" }
    };
  } catch (err) {
    console.log("Axios error:", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.response?.data || err.message }),
    };
  }
}

module.exports = { handler };
