import { getState } from "@/lib/store";

/** Show your match again, but only on the device that drew it (it holds the token). */
export async function POST(request: Request) {
  const { giver, token } = (await request.json()) as { giver?: string; token?: string };
  const state = await getState();
  const claim = state.claims.find((c) => c.giver === giver && c.token === token);
  if (!claim) return Response.json({ error: "Nice try." }, { status: 403 });
  return Response.json({ recipient: claim.recipient });
}
