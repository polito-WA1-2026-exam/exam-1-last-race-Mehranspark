// Circular countdown ring (SVG). The arc shrinks as time runs out and changes
// colour from teal → amber → red. Purely presentational: it receives the current
// seconds and the total, and derives the arc from them.

const SIZE = 96;
const STROKE = 9;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function CircularTimer({ timeLeft, total }) {
  const frac = Math.max(0, Math.min(1, timeLeft / total));
  const offset = CIRC * (1 - frac);
  const color = timeLeft <= 15 ? "var(--danger)" : timeLeft <= 30 ? "var(--warning)" : "var(--accent-2)";

  return (
    <div className={`lr-timer ${timeLeft <= 15 ? "low" : ""}`}>
      <svg width={SIZE} height={SIZE}>
        <circle className="bg" cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} />
        <circle
          className="fg"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="num">{timeLeft}</div>
    </div>
  );
}

export default CircularTimer;
