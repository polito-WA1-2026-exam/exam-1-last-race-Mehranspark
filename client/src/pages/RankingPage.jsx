// Global ranking page (basic version — Phase 12 will refine styling/highlight).
// Lists every user's best score, highest first.

import { useState, useEffect } from "react";
import { Container, Card, Table, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import API from "../API.js";

function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.getRanking()
      .then(setRanking)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Container>
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title as="h2">🏆 Ranking</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          {!ranking && !error && <Spinner animation="border" />}
          {ranking && ranking.length === 0 && (
            <Alert variant="info">No games have been completed yet.</Alert>
          )}
          {ranking && ranking.length > 0 && (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Best score</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, i) => (
                  <tr
                    key={row.username}
                    className={user && row.username === user.username ? "table-primary" : ""}
                  >
                    <td>{i + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.bestScore}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RankingPage;
