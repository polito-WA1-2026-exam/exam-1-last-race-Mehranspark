// Final result screen (Phase 11). Shows the outcome and lets the player start a
// new game or check the ranking. The detailed step-by-step replay happened in the
// Execution phase; here we focus on the final score.

import { Card, Alert, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";

function ResultView({ game, result, onNewGame }) {
  const valid = result.valid;

  // A small flavour message based on the final score.
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
    <Card className="shadow-sm text-center">
      <Card.Body>
        <Card.Title as="h2">Result</Card.Title>

        {!valid && (
          <Alert variant="danger">
            Your route was invalid or incomplete, so you lost all your coins.
            <div className="text-muted small mt-1">Reason: {result.reason}</div>
          </Alert>
        )}

        {valid && (
          <p className="text-muted">
            You travelled from <strong>{game.start.name}</strong> to{" "}
            <strong>{game.dest.name}</strong> across {result.steps.length} segment
            {result.steps.length === 1 ? "" : "s"}.
          </p>
        )}

        <div className="my-4">
          <div className="text-muted">Final score</div>
          <div style={{ fontSize: "3.5rem", fontWeight: 700 }}>
            <Badge bg={result.score > 0 ? "primary" : "secondary"}>{result.score}</Badge>
          </div>
          <div className="text-muted">coins</div>
        </div>

        <p className="lead">{message}</p>

        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button variant="primary" size="lg" onClick={onNewGame}>
            New game
          </Button>
          <Button variant="outline-secondary" size="lg" as={Link} to="/ranking">
            View ranking
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ResultView;
