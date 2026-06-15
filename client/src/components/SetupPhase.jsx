// Setup phase: show the FULL network map (stations + coloured lines), a legend,
// and a button to begin. The full network is a GET (safe in an effect); the game
// is created only on the button click (a user action) so StrictMode can't make
// duplicate games.

import { useState, useEffect } from "react";
import { Card, Button, Alert, Spinner } from "react-bootstrap";
import API from "../API.js";
import NetworkMap from "./NetworkMap.jsx";

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
      await onReady();
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!network)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <Card>
      <Card.Body>
        <h2>Study the network 🗺️</h2>
        <p className="text-muted">
          Memorise the lines and the interchange stations (the bigger white dots, where lines
          meet). During planning the lines disappear — you'll rebuild them from memory.
        </p>

        <div className="lr-legend mb-2">
          {network.map((line) => (
            <span className="sw" key={line.id}>
              <i style={{ background: line.color }} />
              {line.name}
            </span>
          ))}
        </div>

        <NetworkMap lines={network} />

        <div className="text-center mt-3">
          <Button variant="primary" size="lg" onClick={handleStart} disabled={starting}>
            {starting ? "Starting…" : "I'm ready — start planning →"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default SetupPhase;
