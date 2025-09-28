// @ts-nocheck
import axios from "axios";
import { transcribeWithOpenAI, chatReply } from "@/src/lib/openai";
import { textToSpeechSaveFile } from "@/src/lib/tts";
import prisma from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    console.log("Plivo raw body:", bodyText);

    const params = new URLSearchParams(bodyText);
    const recordingUrl = params.get("RecordUrl");
    const callUUID = params.get("CallUUID");

    console.log("Parsed recordingUrl:", recordingUrl);
    console.log("Parsed callUUID:", callUUID);

    if (!recordingUrl) {
      const fallback = `<Response>
        <Speak>No recording received, please try again.</Speak>
        <Record action="${process.env.PUBLIC_BASE_URL}/api/plivo/turn" method="POST" maxLength="20" finishOnKey="#" redirect="false"/>
      </Response>`;
      return new Response(fallback, { headers: { "Content-Type": "application/xml" } });
    }

    // 1) Download caller recording
    const r = await axios.get(recordingUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(r.data);
    console.log("Downloaded recording size:", buffer.length);

    // 2) Transcribe with OpenAI Whisper
    const transcript = await transcribeWithOpenAI(buffer);
    console.log("Transcript:", transcript);

    // 3) Get GPT reply
    const prompt = `You are an assistant on a phone call. Reply courteously and succinctly. Transcript: ${transcript}`;
    const aiReply = await chatReply(prompt);
    console.log("AI Reply:", aiReply);

    // 4) Generate TTS file → stored in /tmp
    const { id: ttsId } = await textToSpeechSaveFile(aiReply);
    const ttsUrl = `${process.env.PUBLIC_BASE_URL}/api/tts?id=${ttsId}`;
    console.log("TTS URL (public):", ttsUrl);

    // 5) Save to DB (non-blocking)
    try {
      await prisma.call.upsert({
        where: { plivoCallUUID: callUUID ?? "" },
        update: { transcript, aiReply, recordingUrl },
        create: {
          plivoCallUUID: callUUID ?? undefined,
          transcript,
          aiReply,
          recordingUrl,
          status: "in-progress",
        },
      });
    } catch (err) {
      console.error("DB write failed, continuing:", err);
    }

    // 6) Respond with <Play> + loop
    const xml = `
      <Response>
        <Play>${ttsUrl}</Play>
        <Record action="${process.env.PUBLIC_BASE_URL}/api/plivo/turn" method="POST" maxLength="20" finishOnKey="#" redirect="false"/>
      </Response>`.trim();

    console.log("Responding with XML:", xml);

    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  } catch (err: any) {
    console.error("Error in /api/plivo/turn with TTS:", err);
    const errXml = `<Response><Speak>Sorry, an error occurred.</Speak></Response>`;
    return new Response(errXml, { headers: { "Content-Type": "application/xml" } });
  }
}
