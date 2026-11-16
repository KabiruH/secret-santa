/** All the attitude in one place. {name}, {budget} and {date} are filled in at runtime. */
export const copy = {
  greetings: [
    "Oh. It's you, {name}.",
    "{name}. We were hoping you'd show up. Sort of.",
    "Welcome, {name}. Lower your expectations.",
    "{name} has entered the chat. Everyone act normal.",
  ],
  suspense: [
    "Consulting the elves…",
    "Bribing a reindeer…",
    "Checking the naughty list…",
    "Shaking it. Vigorously.",
    "Okay okay, here it comes…",
  ],
  quips: [
    "Try not to buy them socks. Or do. We're not your mum.",
    "The budget is {budget}. Not {budget} worth of optimism and financial gymnastics.",
    "Keep it secret. Your face is already giving it away.",
    "\"I know you said you didn't want anything, but…\" is a great start.",
    "A gift card is not a personality. But it is a gift card.",
    "Act surprised when they open it. Practise in the mirror.",
  ],
  nope: {
    taken: "Gone. Snooze, you lose.",
    self: "That one's you. Self-love is lovely, but it isn't a gift.",
    blocked: "Fate says no. Don't argue with fate.",
  },
};

export function pick(list: string[], vars: Record<string, string> = {}) {
  const line = list[Math.floor(Math.random() * list.length)];
  return line.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
