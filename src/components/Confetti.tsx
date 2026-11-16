"use client";

const COLORS = ["#f5c542", "#e8475f", "#2fa36b", "#4b8df8", "#f2e6c9", "#b46cf0"];

/** Scattered but repeatable, so rendering stays pure. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const pieces = Array.from({ length: 90 }, (_, i) => ({
  left: rand(i, 1) * 100,
  delay: rand(i, 2) * 0.6,
  duration: 2.4 + rand(i, 3) * 2,
  size: 6 + rand(i, 4) * 8,
  color: COLORS[i % COLORS.length],
  round: rand(i, 5) > 0.6,
}));

/** Plain CSS confetti, no library. Pieces fall once and stay out of the way. */
export function Confetti() {

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-6 animate-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
