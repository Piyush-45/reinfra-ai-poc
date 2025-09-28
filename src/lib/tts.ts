// @ts-nocheck
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Generate TTS audio with ElevenLabs and save into /tmp
export async function textToSpeechSaveFile(text: string) {
  const id = uuidv4();
  const filePath = `/tmp/tts-${id}.mp3`;

  // Call ElevenLabs
  const response = await fetch(
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

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(filePath, buffer);

  return { id, path: filePath };
}
