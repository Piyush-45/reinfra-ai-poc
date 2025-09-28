// @ts-nocheck
import fs from "fs";

// Streams an MP3 from /tmp to the caller
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  const file = `/tmp/tts-${id}.mp3`;
  try {
    const data = await fs.promises.readFile(file);
    return new Response(data, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return new Response("not found", { status: 404 });
  }
}
