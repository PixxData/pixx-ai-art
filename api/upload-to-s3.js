// api/upload-to-s3.js
import AWS from "aws-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { imageUrl } = req.body;
  if (!imageUrl) {
    res.status(400).json({ error: "No imageUrl provided" });
    return;
  }

  const s3 = new AWS.S3({
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
  });
  const BUCKET = process.env.S3_BUCKET_NAME;

  try {
    // Download the image from OpenAI
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error("Failed to download image from URL");
    const buffer = Buffer.from(await imgResp.arrayBuffer());
    const key = `uploads/${Date.now()}.jpg`;

    // Upload to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: imgResp.headers.get("content-type") || "image/jpeg"
    }).promise();

    const s3Url = `https://${BUCKET}.s3.amazonaws.com/${key}`;
    res.status(200).json({ s3Url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
