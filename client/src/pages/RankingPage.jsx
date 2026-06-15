// Global ranking page: a podium for the top 3, then a table for everyone.
// The current user's rows are highlighted.

import { useState, useEffect } from "react";
import { Container, Card, Table, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import API from "../API.js";

const MEDALS = ["🥇", "🥈", "🥉"];

function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.getRanking()
      .then(setRanking)
      .catch((e) => setError(e.message));
  }, []);

  const isMe = (row) => user && row.username === user.username;

  // Top 3 for the podium, arranged 2nd – 1st – 3rd so 1st is centre & tallest.
  const top = (ranking ?? []).slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  const podiumClass = (row) => (row === top[0] ? "p1" : row === top[1] ? "p2" : "p3");
  const podiumMedal = (row) => MEDALS[top.indexOf(row)];

  return (
    <Container>
      <Card>
        <Card.Body>
          <h2 className="mb-3">🏆 Global Ranking</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {!ranking && !error && (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          )}
          {ranking && ranking.length === 0 && (
            <Alert variant="info">No games have been completed yet — be the first!</Alert>
          )}

          {ranking && ranking.length > 0 && (
            <>
              {/* podium */}
              <div className="lr-podium">
                {podiumOrder.map((row) => (
                  <div key={row.username} className={`lr-pod ${podiumClass(row)} ${isMe(row) ? "lr-me" : ""}`}>
                    <div className="medal">{podiumMedal(row)}</div>
                    <div className="who">{row.name}</div>
                    <div className="pts">{row.bestScore}</div>
                  </div>
                ))}
              </div>

              {/* full table */}
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th className="text-end">Best score</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row, i) => (
                    <tr key={row.username} className={isMe(row) ? "lr-me" : ""}>
                      <td>{i < 3 ? MEDALS[i] : i + 1}</td>
                      <td>{row.name}{isMe(row) && <span className="text-muted"> (you)</span>}</td>
                      <td className="text-end fw-bold" style={{ color: "var(--gold)" }}>{row.bestScore}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RankingPage;
