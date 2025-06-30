// /api/upload-s3.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    res.status(400).json({ error: "Missing imageUrl" });
    return;
  }

  try {
    // Download the image from the provided URL
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set up AWS S3 client
    const s3 = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    // File details
    const fileName = `ai/${Date.now()}_${Math.floor(Math.random() * 999999)}.jpg`;
    const BUCKET = process.env.S3_BUCKET_NAME;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg",
        ACL: "public-read", // So you can display it elsewhere
      })
    );

    // Return the public S3 URL
    const s3Url = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
    res.status(200).json({ s3Url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
