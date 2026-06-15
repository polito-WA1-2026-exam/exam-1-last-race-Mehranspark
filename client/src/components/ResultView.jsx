// Final result screen. Big animated score reveal; confetti for a positive score;
// a clear message for an invalid/incomplete route (which scores 0).

import { Card, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

// A few CSS-driven confetti pieces (decorative only).
function Confetti() {
  const colors = ["#ffd564", "#7c5cff", "#22d3ee", "#34d399", "#fb7185"];
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="lr-confetti" aria-hidden="true">
      {pieces.map((i) => (
        <i
          key={i}
          style={{
            left: `${(i * 4.1) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 6) * 0.25}s`,
            animationDuration: `${2.2 + (i % 5) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function ResultView({ game, result, onNewGame }) {
  const valid = result.valid;
  const message = !valid
    ? "Better luck next time!"
    : result.score >= 25
    ? "Outstanding run! 🎉"
    : result.score >= 15
    ? "Nicely played! 👍"
    : result.score > 0
    ? "You made it — every coin counts."
    : "You arrived, but the coins didn't survive the journey.";

  return (
    <Card className="text-center">
      {valid && result.score > 0 && <Confetti />}
      <Card.Body>
        <h2 className="mb-3">Result</h2>

        {!valid && (
          <Alert variant="danger">
            Your route was invalid or incomplete, so you lost all your coins.
            <div className="text-muted small mt-1">Reason: {result.reason}</div>
          </Alert>
        )}

        {valid && (
          <p className="text-muted">
            {game.start.name} → {game.dest.name} · {result.steps.length} segment
            {result.steps.length === 1 ? "" : "s"}
          </p>
        )}

        <div className="text-muted mt-3">Final score</div>
        <div className="lr-finalscore">{result.score}</div>
        <div className="text-muted mb-3">coins</div>

        <p className="lead">{message}</p>

        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button variant="primary" size="lg" onClick={onNewGame}>
            ↻ New game
          </Button>
          <Button variant="outline-light" size="lg" as={Link} to="/ranking">
            🏆 Ranking
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ResultView;
