// @ts-nocheck
import axios from "axios";
import { transcribeWithOpenAI, chatReply } from "@/lib/openai";
import { textToSpeechSaveFile } from "@/lib/tts";
import prisma from "@/lib/prisma";

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

    // 1) Download recording
    const r = await axios.get(recordingUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(r.data);
    console.log("Downloaded recording size:", buffer.length);

    // 2) Transcribe
    const transcript = await transcribeWithOpenAI(buffer);
    console.log("Transcript:", transcript);

    // 3) AI reply
    const prompt = `You are an assistant on a phone call. Reply courteously and succinctly. Transcript: ${transcript}`;
    const aiReply = await chatReply(prompt);
    console.log("AI Reply:", aiReply);

    // 4) Generate TTS → upload to S3
    const { url: ttsUrl } = await textToSpeechSaveFile(aiReply);
    console.log("TTS URL (S3):", ttsUrl);

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

    // 6) Respond with Play (direct S3 URL) + loop
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
