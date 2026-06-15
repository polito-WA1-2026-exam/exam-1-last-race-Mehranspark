// Execution phase: replays the server's pre-computed steps one at a time.
//
// Outcomes are never recomputed on the client — we only REVEAL what the server
// already decided. A new step appears every STEP_DELAY_MS (slides in), and the
// coin total "bumps" each time it changes.

import { useState, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";

const STARTING_COINS = 20;
const STEP_DELAY_MS = 1300;

function ExecutionPhase({ game, result, onFinish }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const steps = result.steps;

  // Reveal one more step each tick until all are shown, then stop.
  useEffect(() => {
    const id = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= steps.length) { clearInterval(id); return c; }
        return c + 1;
      });
    }, STEP_DELAY_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  const finished = visibleCount >= steps.length;
  const coins = visibleCount === 0 ? STARTING_COINS : steps[visibleCount - 1].coinsAfter;

  return (
    <Card>
      <Card.Body className="text-center">
        <h2 className="mb-1">On the move 🚆</h2>
        <p className="text-muted mb-3">
          {game.start.name} → {game.dest.name}
        </p>

        {result.timedOut && (
          <Alert variant="warning" className="py-2">⏱ Time ran out — your route was auto-submitted.</Alert>
        )}

        {/* big running coin total, bumps on each change (keyed to re-trigger animation) */}
        <div className="mb-1 text-muted">Coins</div>
        <div key={visibleCount} className="lr-coin bump mb-4">🪙 {coins}</div>

        <div className="text-start mx-auto" style={{ maxWidth: 560 }}>
          {steps.slice(0, visibleCount).map((s) => (
            <div className="lr-step" key={s.index}>
              <span>
                <strong>{s.from} → {s.to}</strong>
                <div className="text-muted small">{s.event.description}</div>
              </span>
              <span className="d-flex align-items-center gap-2">
                <span className={`lr-eff ${s.event.effect >= 0 ? "pos" : "neg"}`}>
                  {s.event.effect >= 0 ? `+${s.event.effect}` : s.event.effect}
                </span>
                <strong>{s.coinsAfter}</strong>
              </span>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" className="mt-4" disabled={!finished} onClick={onFinish}>
          {finished ? "See final result →" : "Travelling…"}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ExecutionPhase;
