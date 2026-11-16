/**
 * Everything you might want to change lives here.
 * Adding someone: add their name, add a shape if you run out, redeploy, then reset from /admin.
 */
export const PEOPLE = ["Kabiru", "Golda", "Steve", "Andy", "Jerry", "Vyonne", "Mel"] as const;

/** Pairs who must not draw each other, in either direction. */
export const KEEP_APART: [string, string][] = [
  ["Kabiru", "Golda"],
  ["Andy", "Jerry"],
];

export const EVENT = {
  date: "Tuesday, 22 December",
  budget: "KES 2,000",
};

/** One shape per person. There are spares, so adding people is just a name change above. */
export const SHAPES = [
  { id: "star", label: "Star", color: "#f5c542" },
  { id: "heart", label: "Heart", color: "#e8475f" },
  { id: "tree", label: "Tree", color: "#2fa36b" },
  { id: "bauble", label: "Bauble", color: "#4b8df8" },
  { id: "diamond", label: "Diamond", color: "#b46cf0" },
  { id: "bell", label: "Bell", color: "#f08a3c" },
  { id: "snowflake", label: "Snowflake", color: "#5ad1e6" },
  { id: "moon", label: "Moon", color: "#f2e6c9" },
  { id: "bolt", label: "Lightning", color: "#ffd93d" },
  { id: "cloud", label: "Cloud", color: "#c9d6ea" },
] as const;

export type Person = (typeof PEOPLE)[number];
export type ShapeId = (typeof SHAPES)[number]["id"];
