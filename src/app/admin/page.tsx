"use client";

import { useState } from "react";

/** Organiser page: see who has drawn (not who they got) and reset the whole thing. */
export default function AdminPage() {
  const [key, setKey] = useState("");
  const [people, setPeople] = useState<{ name: string; drawn: boolean }[] | null>(null);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin?key=${encodeURIComponent(key)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setPeople(data.people);
    setMsg("");
  }

  async function reset() {
    const res = await fetch(`/api/admin?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    setConfirming(false);
    if (!res.ok) return setMsg("Not the elf in charge.");
    setMsg("Board reset. Everyone is hiding in new shapes. Tell people to draw again.");
    load();
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Head elf only</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Admin</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mt-8 flex gap-2"
      >
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="min-w-0 flex-1 rounded-xl border-2 border-cream/20 bg-cream/5 px-4 py-3 outline-none focus:border-gold"
        />
        <button className="rounded-xl bg-gold px-5 font-bold text-night">Enter</button>
      </form>

      {msg && <p className="mt-4 text-sm text-cream/80">{msg}</p>}

      {people && (
        <>
          <ul className="mt-8 divide-y divide-cream/10 rounded-2xl bg-cream/5 ring-1 ring-cream/10">
            {people.map((p) => (
              <li key={p.name} className="flex justify-between px-4 py-3">
                <span className="font-semibold">{p.name}</span>
                <span className={p.drawn ? "text-gold" : "text-cream/40"}>{p.drawn ? "Drawn" : "Waiting"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-cream/50">You can see who has drawn, not who they got. No cheating, head elf.</p>

          {confirming ? (
            <div className="mt-8 flex gap-2">
              <button onClick={reset} className="flex-1 rounded-xl bg-berry px-4 py-3 font-bold">
                Yes, wipe everything
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-xl border-2 border-cream/20 px-4 py-3 font-bold">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="mt-8 w-full rounded-xl border-2 border-berry/60 px-4 py-3 font-bold text-berry"
            >
              Reset the draw
            </button>
          )}
        </>
      )}
    </main>
  );
}
