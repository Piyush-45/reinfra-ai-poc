// app/api/plivo/answer/route.ts

export async function POST(req: Request) {
  const publicBase = process.env.PUBLIC_BASE_URL!;
  const recordAction = `${publicBase}/api/plivo/turn`;
  const beep = `${publicBase}/beep.mp3`; // put beep.mp3 in /public

  const xml = `
    <Response>
      <Speak voice="WOMAN">
        Hello! This is the AI assistant. After the beep, please speak.
      </Speak>
      <Play>${beep}</Play>
      <Record action="${recordAction}" method="POST" maxLength="20" finishOnKey="#" redirect="false"/>
    </Response>`.trim();

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
