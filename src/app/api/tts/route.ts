// src/lib/tts.ts
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Example using ElevenLabs API
export async function textToSpeechSaveFile(text: string) {
  const id = uuidv4();

  // Call ElevenLabs (replace with your client code)
  const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text,
      voice_settings: { stability: 0.5, similarity_boost: 0.7 },
    }),
  });

  if (!r.ok) throw new Error(`TTS failed: ${await r.text()}`);
  const audioBuffer = Buffer.from(await r.arrayBuffer());

  // Save into /public/tts so Next.js can serve it statically
  const publicDir = path.join(process.cwd(), "public", "tts");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const filePath = path.join(publicDir, `${id}.mp3`);
  await fs.promises.writeFile(filePath, audioBuffer);

  return { id, path: filePath };
}
