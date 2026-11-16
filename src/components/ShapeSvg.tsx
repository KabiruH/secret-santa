import type { ShapeId } from "@/lib/config";

const paths: Record<ShapeId, React.ReactNode> = {
  star: <path d="M50 6l12.6 27.4 29.9 3.3-22.3 20.3 6.2 29.5L50 71.4 23.6 86.5l6.2-29.5L7.5 36.7l29.9-3.3z" />,
  heart: <path d="M50 88S10 63 10 35a20 20 0 0 1 40-6 20 20 0 0 1 40 6c0 28-40 53-40 53z" />,
  tree: (
    <>
      <path d="M50 6l20 26H58l22 26H62l24 26H14l24-26H20l22-26H30z" />
      <rect x="43" y="84" width="14" height="12" rx="2" />
    </>
  ),
  bauble: (
    <>
      <rect x="42" y="6" width="16" height="12" rx="3" />
      <circle cx="50" cy="56" r="38" />
    </>
  ),
  diamond: <path d="M50 4l40 46-40 46-40-46z" />,
  bell: (
    <>
      <path d="M50 8c-18 0-28 15-28 34v18L12 76h76L78 60V42C78 23 68 8 50 8z" />
      <circle cx="50" cy="86" r="9" />
    </>
  ),
  snowflake: (
    <path
      d="M46 4h8v30l20-20 6 6-20 20h30v8H60l20 20-6 6-20-20v30h-8V66L26 86l-6-6 20-20H10v-8h30L20 32l6-6 20 20z"
      transform="translate(0 2)"
    />
  ),
  moon: <path d="M64 6a44 44 0 1 0 30 70A36 36 0 0 1 64 6z" />,
  bolt: <path d="M58 4L16 56h26l-8 40 46-54H52z" />,
  cloud: <path d="M28 80a20 20 0 0 1-2-40 26 26 0 0 1 50-6 20 20 0 0 1 2 46z" />,
};

export function ShapeSvg({ id, className, style }: { id: ShapeId; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden className={className} style={style}>
      {paths[id]}
    </svg>
  );
}
