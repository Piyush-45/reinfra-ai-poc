// @ts-nocheck
import textToSpeech from "@google-cloud/text-to-speech";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load Google credentials from env var
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);

const client = new textToSpeech.TextToSpeechClient({ credentials });

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function textToSpeechSaveFile(text: string) {
  const id = uuidv4();
  const fileKey = `tts/${id}.mp3`;

  // Call Google Cloud TTS
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode: "en-US", ssmlGender: "FEMALE" },
    audioConfig: { audioEncoding: "MP3", sampleRateHertz: 16000 }, // ✅ telephony safe
  });

  const buffer = Buffer.from(response.audioContent as Uint8Array);

  // Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: buffer,
      ContentType: "audio/mpeg",
    })
  );

  // Public S3 URL
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return { id, url };
}
