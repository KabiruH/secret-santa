import { KEEP_APART, PEOPLE, SHAPES, type ShapeId } from "./config";

/**
 * The board hides one person inside each shape.
 * A claim records who picked which shape (and therefore who they give to).
 */
export type Claim = { giver: string; shape: ShapeId; recipient: string; token: string };
export type DrawState = {
  board: Record<string, string>; // shapeId -> recipient
  claims: Claim[];
};

export function canGive(giver: string, recipient: string) {
  if (giver === recipient) return false;
  return !KEEP_APART.some(([a, b]) => (a === giver && b === recipient) || (a === recipient && b === giver));
}

/**
 * Can every remaining giver still get a valid remaining recipient?
 * Small group, so a simple backtracking search is plenty.
 */
export function hasCompleteMatching(givers: string[], recipients: string[]): boolean {
  if (givers.length === 0) return true;
  const [first, ...rest] = givers;
  return recipients.some(
    (r, i) => canGive(first, r) && hasCompleteMatching(rest, recipients.filter((_, j) => j !== i)),
  );
}

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hide each person in a random shape. Only as many shapes as people go on the board. */
export function createBoard(): DrawState {
  if (!hasCompleteMatching([...PEOPLE], [...PEOPLE])) {
    throw new Error("These KEEP_APART rules make a valid draw impossible.");
  }
  const shapes = shuffle(SHAPES.map((s) => s.id)).slice(0, PEOPLE.length);
  const people = shuffle(PEOPLE);
  const board: Record<string, string> = {};
  shapes.forEach((shape, i) => (board[shape] = people[i]));
  return { board, claims: [] };
}

export type ShapeStatus = "open" | "taken" | "self" | "blocked";

/**
 * What a given person sees on the board.
 * "self": their own shape. "blocked": a partner, or a pick that would leave someone stuck later.
 */
export function shapeStatuses(state: DrawState, giver: string | null): Record<string, ShapeStatus> {
  const takenShapes = new Set(state.claims.map((c) => c.shape));
  const remainingGivers = PEOPLE.filter((p) => p !== giver && !state.claims.some((c) => c.giver === p));
  const out: Record<string, ShapeStatus> = {};

  for (const [shape, recipient] of Object.entries(state.board)) {
    if (takenShapes.has(shape as ShapeId)) out[shape] = "taken";
    else if (!giver) out[shape] = "open";
    else if (recipient === giver) out[shape] = "self";
    else if (!canGive(giver, recipient)) out[shape] = "blocked";
    else {
      const remainingRecipients = Object.entries(state.board)
        .filter(([s]) => s !== shape && !takenShapes.has(s as ShapeId))
        .map(([, r]) => r);
      out[shape] = hasCompleteMatching(remainingGivers, remainingRecipients) ? "open" : "blocked";
    }
  }
  return out;
}
