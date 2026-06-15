// Execution phase: replays the server's result one step at a time.
//
// The server already validated the route and computed every event + the running
// coin total (we never recompute outcomes on the client). Here we just REVEAL
// those pre-computed steps in sequence for a nice "journey" effect, then let the
// player continue to the final result.

import { useState, useEffect } from "react";
import { Card, ListGroup, Badge, Button, Alert } from "react-bootstrap";

const STARTING_COINS = 20;
const STEP_DELAY_MS = 1200; // time between revealed steps

function ExecutionPhase({ game, result, onFinish }) {
  // How many steps are currently shown (0 = only the starting coins).
  const [visibleCount, setVisibleCount] = useState(0);
  const steps = result.steps;

  // Reveal one more step every STEP_DELAY_MS until all are shown, then stop.
  useEffect(() => {
    const id = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= steps.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, STEP_DELAY_MS);
    return () => clearInterval(id); // cleanup on unmount
  }, [steps.length]);

  const finished = visibleCount >= steps.length;
  // Running total = the coins after the last revealed step (or the start amount).
  const coins = visibleCount === 0 ? STARTING_COINS : steps[visibleCount - 1].coinsAfter;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title as="h2">
          Execution — {game.start.name} → {game.dest.name}
        </Card.Title>
        {result.timedOut && (
          <Alert variant="warning" className="py-2">
            ⏱ Time ran out — your route was auto-submitted.
          </Alert>
        )}

        <h3 className="my-3">
          Coins: <Badge bg="primary">{coins}</Badge>
        </h3>

        <ListGroup>
          <ListGroup.Item className="text-muted">Start with {STARTING_COINS} coins</ListGroup.Item>
          {steps.slice(0, visibleCount).map((s) => (
            <ListGroup.Item
              key={s.index}
              className="d-flex justify-content-between align-items-center"
            >
              <span>
                <strong>
                  {s.from} → {s.to}
                </strong>
                : {s.event.description}
              </span>
              <span>
                <Badge bg={s.event.effect >= 0 ? "success" : "danger"} className="me-2">
                  {s.event.effect >= 0 ? `+${s.event.effect}` : s.event.effect}
                </Badge>
                = {s.coinsAfter}
              </span>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Button
          variant="primary"
          className="mt-3"
          disabled={!finished}
          onClick={onFinish}
        >
          {finished ? "See final result" : "Travelling…"}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ExecutionPhase;
