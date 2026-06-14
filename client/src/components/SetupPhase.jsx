// Setup phase: show the FULL network map (stations, lines, connections), then let
// the player start. Fetching the full network is a GET, so it is safe to run in a
// useEffect; the game itself is created only when the player clicks the button
// (a user action, never in an effect — that avoids creating duplicate games under
// React StrictMode's double-invocation in development).

import { useState, useEffect } from "react";
import { Card, Button, Alert, Spinner, Badge } from "react-bootstrap";
import API from "../API.js";

function SetupPhase({ onReady }) {
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    API.getFullNetwork()
      .then(setNetwork)
      .catch((e) => setError(e.message));
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      await onReady(); // parent creates the game and switches phase
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!network) return <Spinner animation="border" />;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title as="h2">Setup — study the network</Card.Title>
        <Card.Text className="text-muted">
          Each line below lists its stations in order. Stations on more than one line are
          interchanges — the only places you may switch lines. Study the map, then start:
          the lines will be hidden during planning.
        </Card.Text>

        {network.map((line) => (
          <div key={line.id} className="mb-3">
            <h5>
              <Badge style={{ backgroundColor: line.color }}>{line.name}</Badge>
            </h5>
            <div>
              {line.stations.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && <span className="text-muted"> — </span>}
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}

        <Button variant="primary" size="lg" onClick={handleStart} disabled={starting}>
          {starting ? "Starting…" : "I'm ready — start planning"}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default SetupPhase;
