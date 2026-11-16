"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ShapeId } from "@/lib/config";
import type { ShapeStatus } from "@/lib/draw";
import { copy, pick } from "@/lib/copy";
import { ShapeSvg } from "./ShapeSvg";
import { Confetti } from "./Confetti";

type Board = {
  people: { name: string; drawn: boolean }[];
  shapes: { id: ShapeId; label: string; color: string; status: ShapeStatus }[];
  forced: boolean;
  remaining: number;
  event: { date: string; budget: string };
};

type Phase =
  | { step: "name" }
  | { step: "shape"; giver: string; greeting: string }
  | { step: "drawing"; giver: string; shape: Board["shapes"][number] }
  | { step: "reveal"; giver: string; recipient: string; shape?: Board["shapes"][number]; quip: string };

const SAVED_KEY = "santa:claim";
/** How long each "Consulting the elves…" line stays up. The reveal waits for all of them. */
const SUSPENSE_STEP_MS = 1500;

type Saved = { giver: string; token: string };

/** "Forgot who you got?" lives in this device's localStorage, read without a hydration mismatch. */
function subscribeSaved(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("santa-saved", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("santa-saved", cb);
  };
}

function writeSaved(value: Saved | null) {
  if (value) localStorage.setItem(SAVED_KEY, JSON.stringify(value));
  else localStorage.removeItem(SAVED_KEY);
  window.dispatchEvent(new Event("santa-saved"));
}

export function SantaApp() {
  const [phase, setPhase] = useState<Phase>({ step: "name" });
  const [board, setBoard] = useState<Board | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const savedRaw = useSyncExternalStore(subscribeSaved, () => localStorage.getItem(SAVED_KEY), () => null);
  const saved = useMemo<Saved | null>(() => {
    try {
      return savedRaw ? JSON.parse(savedRaw) : null;
    } catch {
      return null;
    }
  }, [savedRaw]);

  const giver = phase.step === "name" ? null : phase.giver;
  // A saved draw that no longer exists on the board means the organiser reset it
  const savedIsLive = Boolean(saved && board?.people.some((p) => p.name === saved.giver && p.drawn));

  useEffect(() => {
    if (saved && board && !savedIsLive) writeSaved(null);
  }, [saved, board, savedIsLive]);

  const fetchBoard = useCallback(async (): Promise<Board | null> => {
    const qs = giver ? `?giver=${encodeURIComponent(giver)}` : "";
    const res = await fetch(`/api/board${qs}`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  }, [giver]);

  // Keep the board live while people are choosing, so taken shapes grey out on everyone's phone
  useEffect(() => {
    if (phase.step === "drawing" || phase.step === "reveal") return;
    let active = true;
    const tick = () =>
      fetchBoard().then((b) => {
        if (active && b) setBoard(b);
      });
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [fetchBoard, phase.step]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const vars = useMemo(
    () => ({ budget: board?.event.budget ?? "", date: board?.event.date ?? "" }),
    [board?.event.budget, board?.event.date],
  );

  async function chooseShape(shape: Board["shapes"][number]) {
    if (phase.step !== "shape") return;
    if (shape.status !== "open") return setToast(copy.nope[shape.status]);

    setPhase({ step: "drawing", giver: phase.giver, shape });
    const [res] = await Promise.all([
      fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giver: phase.giver, shape: shape.id }),
      }),
      new Promise((r) => setTimeout(r, SUSPENSE_STEP_MS * copy.suspense.length)), // the suspense is the whole point
    ]);
    const data = await res.json();

    if (!res.ok) {
      setToast(data.error);
      setPhase({ step: "shape", giver: phase.giver, greeting: "Right. Try again." });
      return;
    }
    writeSaved({ giver: phase.giver, token: data.token });
    // Mark the draw on the board straight away, so the lock holds before the next refresh
    const drew = phase.giver;
    setBoard((b) =>
      b && { ...b, remaining: b.remaining - 1, people: b.people.map((p) => (p.name === drew ? { ...p, drawn: true } : p)) },
    );
    setPhase({ step: "reveal", giver: phase.giver, recipient: data.recipient, shape, quip: pick(copy.quips, vars) });
  }

  async function revealAgain() {
    if (!saved) return;
    const res = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saved),
    });
    if (!res.ok) {
      writeSaved(null);
      return setToast("That draw was reset. Pick your name again.");
    }
    const data = await res.json();
    setPhase({ step: "reveal", giver: saved.giver, recipient: data.recipient, quip: "Forgot already? Bold." });
  }

  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 pb-16 pt-10 sm:pt-16">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Secret Santa · 2026</p>
      </header>

      {/* This phone has already drawn: no second go as someone else */}
      {phase.step === "name" && savedIsLive && saved && (
        <section className="mt-6 animate-rise text-center">
          <h1 className="font-display text-5xl font-extrabold leading-none sm:text-7xl">Nice try, {saved.giver}.</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-cream/75">
            You&apos;ve already drawn. One Santa, one go. Greedy is not a festive look.
          </p>
          <button
            type="button"
            onClick={revealAgain}
            className="mt-10 rounded-full bg-gold px-8 py-4 text-lg font-bold text-night transition hover:-translate-y-1 active:scale-95"
          >
            Remind me who I got
          </button>
          {board && (
            <p className="mt-8 text-sm text-cream/60">
              {board.remaining === 0
                ? "Everyone's drawn. Go shopping."
                : `${board.remaining} of ${board.people.length} still to draw. Nag them.`}
            </p>
          )}
        </section>
      )}

      {/* Until the board loads, a phone that has drawn shows nothing tappable */}
      {phase.step === "name" && saved && !board && <p className="mt-16 text-center text-cream/50">Waking the elves…</p>}

      {phase.step === "name" && (!saved || (board && !savedIsLive)) && (
        <section className="mt-6 animate-rise text-center">
          <h1 className="font-display text-5xl font-extrabold leading-none sm:text-7xl">Who dis?</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-cream/75">
            Pick your name. Not someone else&apos;s. We will know.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(board?.people ?? []).map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  p.drawn
                    ? setToast(`${p.name} has already drawn. Nice try.`)
                    : setPhase({ step: "shape", giver: p.name, greeting: pick(copy.greetings, { name: p.name }) })
                }
                className={
                  p.drawn
                    ? "rounded-2xl border-2 border-cream/10 px-4 py-5 text-lg font-bold text-cream/30 line-through"
                    : "rounded-2xl border-2 border-cream/20 bg-cream/5 px-4 py-5 text-lg font-bold transition hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-night active:scale-95"
                }
              >
                {p.name}
              </button>
            ))}
            {!board && <p className="col-span-full text-cream/50">Waking the elves…</p>}
          </div>

          {board && (
            <p className="mt-8 text-sm text-cream/60">
              {board.remaining === 0
                ? "Everyone's drawn. Go shopping."
                : `${board.remaining} of ${board.people.length} still to draw. Hurry up.`}
            </p>
          )}

        </section>
      )}

      {phase.step === "shape" && board && (
        <section className="mt-6 animate-rise text-center">
          <p className="text-lg font-semibold text-gold">{phase.greeting}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-6xl">Pick a shape. Any shape.</h1>
          <p className="mx-auto mt-4 max-w-md text-cream/75">
            Somebody is hiding in each one. Choose with your heart, or your thumb, whichever is closer.
          </p>

          {board.forced && (
            <p className="mx-auto mt-6 max-w-md rounded-2xl bg-berry/20 px-4 py-3 text-sm font-semibold text-cream">
              Only one shape left for you. Fate has made this decision. Fate is lazy.
            </p>
          )}

          <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-4">
            {board.shapes.map((s, i) => {
              const open = s.status === "open";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => chooseShape(s)}
                  aria-label={`${s.label}${open ? "" : `, ${s.status}`}`}
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-3xl border-2 transition ${
                    open
                      ? "border-cream/15 bg-cream/5 hover:-translate-y-1 hover:border-cream/40 active:scale-95"
                      : "cursor-not-allowed border-transparent bg-cream/[0.03]"
                  }`}
                >
                  <ShapeSvg
                    id={s.id}
                    className={`size-3/5 transition ${open ? "animate-bob group-hover:animate-wiggle" : "opacity-15 grayscale"}`}
                    style={{ color: s.color, animationDelay: `${i * 0.25}s` }}
                  />
                  {!open && (
                    <span className="absolute bottom-2 text-[11px] font-bold uppercase tracking-wider text-cream/50">
                      {s.status === "taken" ? "Taken" : s.status === "self" ? "That's you" : "Nope"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPhase({ step: "name" })}
            className="mt-10 text-sm text-cream/60 underline-offset-4 hover:text-cream hover:underline"
          >
            Not {phase.giver}? Go back, impostor.
          </button>
        </section>
      )}

      {phase.step === "drawing" && <Drawing shape={phase.shape} />}

      {phase.step === "reveal" && (
        <section className="mt-6 animate-rise text-center">
          <Confetti />
          {phase.shape && (
            <ShapeSvg id={phase.shape.id} className="mx-auto size-20 animate-pop" style={{ color: phase.shape.color }} />
          )}
          <p className="mt-6 text-xl font-semibold text-cream/80">{phase.giver}, you&apos;ve got</p>
          <h1 className="mt-2 animate-pop font-display text-7xl font-extrabold leading-none text-gold sm:text-9xl">
            {phase.recipient}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-cream/80">{phase.quip}</p>

          <dl className="mx-auto mt-10 grid max-w-md gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
              <dt className="text-xs font-bold uppercase tracking-wider text-gold">Gift day</dt>
              <dd className="mt-1 font-semibold">{board?.event.date}</dd>
            </div>
            <div className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
              <dt className="text-xs font-bold uppercase tracking-wider text-gold">Budget</dt>
              <dd className="mt-1 font-semibold">{board?.event.budget}. Max. Not KES 2,000 worth of optimism and financial gymnastics.</dd>
            </div>
          </dl>
          <p className="mt-8 text-sm text-cream/60">
            Screenshot this. This device remembers, but don&apos;t test us.
          </p>
          <button
            type="button"
            onClick={() => setPhase({ step: "name" })}
            className="mt-6 rounded-full border-2 border-cream/20 px-6 py-3 text-sm font-bold transition hover:border-cream/50"
          >
            Back to the board
          </button>
        </section>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-5">
          <p className="animate-rise rounded-full bg-cream px-5 py-3 text-sm font-bold text-night shadow-2xl">{toast}</p>
        </div>
      )}
    </main>
  );
}

function Drawing({ shape }: { shape: Board["shapes"][number] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, copy.suspense.length - 1)), SUSPENSE_STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mt-16 flex flex-col items-center text-center" aria-live="polite">
      <ShapeSvg id={shape.id} className="size-40 animate-shake sm:size-52" style={{ color: shape.color }} />
      <p key={i} className="mt-10 animate-rise font-display text-2xl font-bold">
        {copy.suspense[i]}
      </p>
    </section>
  );
}