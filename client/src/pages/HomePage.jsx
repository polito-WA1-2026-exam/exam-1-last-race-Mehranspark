// Public landing page. Everyone can read the instructions; anonymous visitors get
// a "log in to play" prompt, logged-in users get a "play" button. No network map
// is shown to anonymous users.
//
// The instruction text comes from the server (GET /api/instructions); here we
// present it as numbered, animated "how to play" cards. The icon + short title for
// each card are presentation only and are paired to the server text by index.

import { useState, useEffect } from "react";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import API from "../API.js";

// Presentation metadata for each step (paired to the server paragraphs by index).
const STEP_META = [
  { ic: "🚇", title: "The mission" },
  { ic: "⏱️", title: "Beat the clock" },
  { ic: "✅", title: "Build a valid route" },
  { ic: "🎲", title: "Ride the chaos" },
  { ic: "🏆", title: "Top the ranking" },
];

const PILLS = ["🗺️ Hidden metro map", "⏱️ 90-second sprint", "🎲 Random events", "🏆 Global ranking"];

const STATS = [
  { v: "90s", l: "to plan your route" },
  { v: "20", l: "coins to start" },
  { v: "±4", l: "coins per event" },
  { v: "∞", l: "games to climb" },
];

function HomePage() {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.getInstructions()
      .then(setInstructions)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Container>
      {/* hero */}
      <div className="lr-hero">
        <h1>Last Race</h1>
        <p className="lr-sub">
          You've got <strong>90 seconds</strong> and a network you can't fully see. Memorise the
          lines, plan the smartest route, and survive the unexpected — the rider with the most
          coins wins.
        </p>

        <div className="lr-pills">
          {PILLS.map((p, i) => (
            <span className="lr-pill" key={p} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              {p}
            </span>
          ))}
        </div>

        <div className="mt-4">
          {user ? (
            <Button as={Link} to="/play" variant="primary" size="lg" className="lr-cta">
              ▶ Play now
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="primary" size="lg" className="lr-cta">
              Log in to play
            </Button>
          )}
        </div>
      </div>

      {/* stats strip */}
      <div className="lr-stats">
        {STATS.map((s, i) => (
          <div className="lr-stat" key={s.l} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
            <div className="v">{s.v}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* how to play */}
      <h2 className="mb-3">How to play</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {!instructions && !error && (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      )}

      {instructions && (
        <>
          <div className="lr-steps">
            {instructions.paragraphs.map((p, i) => {
              const meta = STEP_META[i] ?? { ic: "•", title: "Step" };
              return (
                <div className="lr-step-card" key={i} style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                  <div className="ic">{meta.ic}</div>
                  <div>
                    <div className="num">STEP {String(i + 1).padStart(2, "0")}</div>
                    <h5>{meta.title}</h5>
                    <p>{p}</p>
                  </div>
                  <span className="ghost">{i + 1}</span>
                </div>
              );
            })}
          </div>

          {!user && (
            <Alert variant="info" className="mt-4 mb-0 text-center">
              Ready? <Link to="/login">Log in</Link> to start your first race and claim a spot on the ranking.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
}

export default HomePage;
