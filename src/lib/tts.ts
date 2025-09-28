// @ts-nocheck
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Generate TTS audio with ElevenLabs and upload to S3
export async function textToSpeechSaveFile(text: string) {
  const id = uuidv4();
  const fileKey = `tts/${id}.mp3`;

  // Call ElevenLabs
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.5, similarity_boost: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${await res.text()}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  // Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: buffer,
      ContentType: "audio/mpeg",
      ACL: "public-read",
    })
  );

  // Public S3 URL
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return { id, url };
}
