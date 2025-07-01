import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let imageUrl, userFilename;

  // Parse the body only ONCE
  let bodyObj;
  try {
    if (!req.body || typeof req.body === "string") {
      let bodyRaw = req.body;
      if (!bodyRaw) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        bodyRaw = Buffer.concat(chunks).toString();
      }
      bodyObj = JSON.parse(bodyRaw);
    } else {
      bodyObj = req.body;
    }
    imageUrl = bodyObj.imageUrl;
    userFilename = bodyObj.filename;
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  if (!imageUrl) {
    res.status(400).json({ error: "Missing imageUrl" });
    return;
  }

  try {
    // Download the image from the provided URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image from imageUrl");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Clean up the filename for S3
    const safeFilename =
      typeof userFilename === "string" && userFilename.match(/^[\w\-\.]{3,64}$/)
        ? userFilename
        : `${Date.now()}_${Math.floor(Math.random() * 999999)}.jpg`;

    const fileName = `uploads/${safeFilename}`;
    const BUCKET = process.env.S3_BUCKET_NAME;

    // Create the S3 client
    const s3 = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    // Return the public S3 URL
    const s3Url = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
    res.status(200).json({ s3Url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
