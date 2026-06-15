// Public landing page. Everyone can read the instructions; anonymous visitors get
// a "log in to play" prompt, logged-in users get a "play" button. No network map
// is shown to anonymous users.

import { useState, useEffect } from "react";
import { Container, Card, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import API from "../API.js";

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
          Race across a hidden underground network. Plan a clever route against the clock,
          ride out the unexpected, and finish with the most coins.
        </p>
        <div className="mt-4">
          {user ? (
            <Button as={Link} to="/play" variant="primary" size="lg">
              ▶ Play now
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="primary" size="lg">
              Log in to play
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {!instructions && !error && (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      )}

      {instructions && (
        <Card className="mt-3">
          <Card.Body>
            <h2 className="mb-3">{instructions.title}</h2>
            <Row className="g-3">
              {instructions.paragraphs.map((p, i) => (
                <Col md={6} key={i}>
                  <div className="lr-panel p-3 h-100">
                    <div className="d-flex gap-2">
                      <span style={{ fontSize: "1.3rem" }}>
                        {["🗺️", "⏱️", "✅", "🎲", "🏆"][i] ?? "•"}
                      </span>
                      <span>{p}</span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            {!user && (
              <Alert variant="info" className="mt-3 mb-0">
                Please <Link to="/login">log in</Link> to play and join the ranking.
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default HomePage;
