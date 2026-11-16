import { Redis } from "@upstash/redis";
import { createBoard, type DrawState } from "./draw";

/**
 * Upstash Redis in production. Without its env vars (local dev), state lives in memory
 * and resets when the dev server restarts.
 */
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const STATE_KEY = "santa:state";
const LOCK_KEY = "santa:lock";

const memory = globalThis as unknown as { __santa?: DrawState; __santaLock?: boolean };

async function read(): Promise<DrawState | null> {
  if (redis) return (await redis.get<DrawState>(STATE_KEY)) ?? null;
  return memory.__santa ?? null;
}

async function write(state: DrawState) {
  if (redis) await redis.set(STATE_KEY, state);
  else memory.__santa = state;
}

/** Use inside withLock. Creates the board the first time anyone opens the app. */
export async function readOrCreate(): Promise<DrawState> {
  const existing = await read();
  if (existing) return existing;
  const fresh = createBoard();
  await write(fresh);
  return fresh;
}

export async function getState(): Promise<DrawState> {
  return (await read()) ?? withLock(readOrCreate);
}

export async function resetState() {
  if (redis) await redis.del(STATE_KEY);
  else delete memory.__santa;
}

/**
 * Only one claim at a time, so two people tapping the same shape can't both get it.
 * The lock expires on its own after 5 seconds in case a request dies halfway.
 */
export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const got = redis
      ? (await redis.set(LOCK_KEY, "1", { nx: true, px: 5000 })) === "OK"
      : !memory.__santaLock && (memory.__santaLock = true);
    if (got) {
      try {
        return await fn();
      } finally {
        if (redis) await redis.del(LOCK_KEY);
        else memory.__santaLock = false;
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Board is busy");
}

export async function saveState(state: DrawState) {
  await write(state);
}
