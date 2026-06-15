// Login page: a controlled form (React L15/L16). On success we navigate to /play;
// if already logged in, we redirect away.

import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Controlled inputs: the field values live in React state.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Don't show the form.
  if (user) return <Navigate to="/play" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault(); // stop the browser's full-page form submit
    setError(null);

    // Basic client-side validation (the server validates too).
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/play");
    } catch (err) {
      setError(err.message || "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <Container style={{ maxWidth: 420 }} className="pt-4">
      <Card>
        <Card.Body>
          <h2 className="mb-1">Welcome back</h2>
          <p className="text-muted">Log in to play Last Race.</p>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Logging in…" : "Login"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;
