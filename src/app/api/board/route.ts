import { connection } from "next/server";
import { EVENT, PEOPLE, SHAPES } from "@/lib/config";
import { shapeStatuses } from "@/lib/draw";
import { getState } from "@/lib/store";

/** Public board: who has drawn and which shapes are gone. Never says who is inside a shape. */
export async function GET(request: Request) {
  await connection();
  const giverParam = new URL(request.url).searchParams.get("giver");
  const giver = PEOPLE.find((p) => p === giverParam) ?? null;

  const state = await getState();
  const statuses = shapeStatuses(state, giver);
  const drawn = new Set(state.claims.map((c) => c.giver));
  const shapes = SHAPES.filter((s) => s.id in state.board).map((s) => ({ ...s, status: statuses[s.id] }));

  return Response.json({
    people: PEOPLE.map((name) => ({ name, drawn: drawn.has(name) })),
    shapes,
    // Exactly one pick left for this person: the UI says so, with attitude
    forced: giver ? shapes.filter((s) => s.status === "open").length === 1 : false,
    remaining: PEOPLE.length - drawn.size,
    event: EVENT,
  });
}
