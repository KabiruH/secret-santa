import { PEOPLE, type ShapeId } from "@/lib/config";
import { shapeStatuses } from "@/lib/draw";
import { readOrCreate, saveState, withLock } from "@/lib/store";

/** Claim a shape. Everything is checked again here, inside the lock, whatever the screen showed. */
export async function POST(request: Request) {
  const { giver, shape } = (await request.json()) as { giver?: string; shape?: ShapeId };
  if (!giver || !PEOPLE.includes(giver as (typeof PEOPLE)[number]) || !shape) {
    return Response.json({ error: "Who are you, even?" }, { status: 400 });
  }

  try {
    return await withLock(async () => {
      const state = await readOrCreate();

      if (state.claims.some((c) => c.giver === giver)) {
        return Response.json({ error: "You've already drawn. One Santa, one go." }, { status: 409 });
      }
      const status = shapeStatuses(state, giver)[shape];
      if (status === "taken") {
        return Response.json({ error: "Someone beat you to it. Tragic. Pick another." }, { status: 409 });
      }
      if (status !== "open") {
        return Response.json({ error: "Not that one. Fate said no." }, { status: 409 });
      }

      const claim = { giver, shape, recipient: state.board[shape], token: crypto.randomUUID() };
      state.claims.push(claim);
      await saveState(state);
      return Response.json({ recipient: claim.recipient, token: claim.token });
    });
  } catch {
    return Response.json({ error: "Too many elves at once. Try again." }, { status: 503 });
  }
}
