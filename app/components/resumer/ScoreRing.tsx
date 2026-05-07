type Props = {
  value?: number;
  size?: number;
};

function strokeFor(value: number): string {
  if (value > 75) return "#D4FF3A";
  if (value < 60) return "#E64514";
  return "var(--ink)";
}

export function ScoreRing({ value = 82, size = 180 }: Props) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (safe / 100) * c;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--bg-3)"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeFor(safe)}
          strokeWidth={8}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke .3s ease" }}
        />
      </svg>
      <div className="center">
        <div className="num">
          {safe}
          <small>/100</small>
        </div>
        <div className="lbl">ATS Compatibility</div>
      </div>
    </div>
  );
}
