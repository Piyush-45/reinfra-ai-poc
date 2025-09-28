// src/lib/openai.ts
import axios from "axios";
import FormData from "form-data";

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

export async function transcribeWithOpenAI(buffer: Buffer, filename = "recording.wav") {
  const form = new FormData();
  form.append("file", buffer, { filename });
  form.append("model", "whisper-1");
  const res = await axios.post("https://api.openai.com/v1/audio/transcriptions", form, {
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
  });
  return res.data?.text ?? "";
}

export async function chatReply(prompt: string) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: OPENAI_CHAT_MODEL,
      messages: [
        { role: "system", content: "You are a concise, helpful assistant for a phone conversation." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const choices = res.data?.choices;
  const msg = choices?.[0]?.message?.content ?? "";
  return msg;
}
