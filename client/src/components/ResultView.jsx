// Result view (interim — Phase 10 will animate the steps one at a time, Phase 11
// will polish the final screen). For now it shows the outcome the server returned:
// either an invalid-route message (score 0) or the list of events + final score.

import { Card, Alert, Table, Button, Badge } from "react-bootstrap";

function ResultView({ result, onNewGame }) {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title as="h2">Result</Card.Title>

        {!result.valid ? (
          <Alert variant="danger">
            Your route was invalid or incomplete, so you lost all your coins.
            <div className="text-muted">Reason: {result.reason}</div>
          </Alert>
        ) : (
          <>
            <Table striped bordered responsive className="mt-2">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Segment</th>
                  <th>Event</th>
                  <th>Effect</th>
                  <th>Coins</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((s) => (
                  <tr key={s.index}>
                    <td>{s.index + 1}</td>
                    <td>
                      {s.from} → {s.to}
                    </td>
                    <td>{s.event.description}</td>
                    <td>
                      <Badge bg={s.event.effect >= 0 ? "success" : "danger"}>
                        {s.event.effect >= 0 ? `+${s.event.effect}` : s.event.effect}
                      </Badge>
                    </td>
                    <td>{s.coinsAfter}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        <h3 className="mt-3">
          Final score: <Badge bg="primary">{result.score}</Badge> coins
        </h3>

        <Button variant="primary" className="mt-2" onClick={onNewGame}>
          New game
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ResultView;
