// src/lib/plivo.ts
import axios from "axios";

const PLIVO_AUTH_ID = process.env.PLIVO_AUTH_ID!;
const PLIVO_AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN!;

export async function makePlivoCall(to: string, from: string, answerUrl: string) {
  const url = `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/`;
  const body = {
    from,
    to,
    answer_url: answerUrl,
    answer_method: "POST"
  };
  const res = await axios.post(url, body, {
    auth: { username: PLIVO_AUTH_ID, password: PLIVO_AUTH_TOKEN },
  });
  return res.data;
}
