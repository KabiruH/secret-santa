import { connection } from "next/server";
import { PEOPLE } from "@/lib/config";
import { getState, resetState } from "@/lib/store";

function authorised(key: string | null) {
  const secret = process.env.ADMIN_KEY;
  return Boolean(secret) && key === secret;
}

/** Progress only: who has drawn. Even the organiser doesn't get to see who has whom. */
export async function GET(request: Request) {
  await connection();
  if (!authorised(new URL(request.url).searchParams.get("key"))) {
    return Response.json({ error: "Not the elf in charge." }, { status: 401 });
  }
  const state = await getState();
  const drawn = new Set(state.claims.map((c) => c.giver));
  return Response.json({ people: PEOPLE.map((name) => ({ name, drawn: drawn.has(name) })) });
}

/** Wipe the draw and hide everyone in fresh shapes. */
export async function DELETE(request: Request) {
  if (!authorised(new URL(request.url).searchParams.get("key"))) {
    return Response.json({ error: "Not the elf in charge." }, { status: 401 });
  }
  await resetState();
  return Response.json({ ok: true });
}
