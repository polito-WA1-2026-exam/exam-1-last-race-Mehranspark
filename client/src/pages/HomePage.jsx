// Public landing page. Everyone can read the instructions; anonymous visitors get
// a "log in to play" prompt, logged-in users get a "play" button. (No network map
// is shown to anonymous users — that's only inside the game, which is protected.)

import { useState, useEffect } from "react";
import { Container, Card, Button, Alert, Spinner } from "react-bootstrap";
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
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {!instructions && !error && <Spinner animation="border" />}
          {instructions && (
            <>
              <Card.Title as="h2">{instructions.title}</Card.Title>
              {instructions.paragraphs.map((p, i) => (
                <Card.Text key={i}>{p}</Card.Text>
              ))}
              <div className="mt-3">
                {user ? (
                  <Button as={Link} to="/play" variant="primary" size="lg">
                    Play now
                  </Button>
                ) : (
                  <Alert variant="info" className="mb-0">
                    Please <Link to="/login">log in</Link> to play and join the ranking.
                  </Alert>
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default HomePage;
