// Planning phase: the timed route-builder.
//
// The player sees the stations and the flat list of segments (pairs) — but NOT
// the lines (the server doesn't send them). A 90-second countdown runs; when it
// reaches zero the route built so far is auto-submitted. The player can also
// submit earlier. Each segment may be selected only once, in sequence.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, Button, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import API from "../API.js";

function PlanningPhase({ game, onSubmitted }) {
  const [data, setData] = useState(null); // { stations, segments }
  const [selected, setSelected] = useState([]); // ordered segment ids
  const [timeLeft, setTimeLeft] = useState(game.planningSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Refs that survive re-renders without causing them.
  const submittedRef = useRef(false); // ensures we submit at most once
  const selectedRef = useRef(selected); // latest selection for the auto-submit
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Load the planning view (stations + segments, no lines). GET → safe in effect.
  useEffect(() => {
    API.getPlanningNetwork()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // Submit the route (manual button or automatic at time-out). Guarded so it runs
  // only once even if the timer and a click race each other.
  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await API.submitRoute(game.id, selectedRef.current);
      onSubmitted(result);
    } catch (e) {
      setError(e.message);
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [game.id, onSubmitted]);

  // The countdown: one interval for the whole phase, cleared on unmount.
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id); // cleanup prevents leaks / double-ticking
  }, []);

  // When the clock hits zero, auto-submit whatever has been built.
  useEffect(() => {
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft, handleSubmit]);

  // Fast lookup of a segment by id.
  const segById = useMemo(
    () => new Map((data?.segments ?? []).map((s) => [s.id, s])),
    [data]
  );

  // Reconstruct the station path from the selected segments (for display + hints).
  const path = useMemo(() => {
    if (!data) return { names: [], currentId: game.start.id, broken: false };
    let currentId = game.start.id;
    const names = [game.start.name];
    let broken = false;
    for (const id of selected) {
      const seg = segById.get(id);
      if (!seg) { broken = true; break; }
      if (seg.stationA.id === currentId) {
        names.push(seg.stationB.name);
        currentId = seg.stationB.id;
      } else if (seg.stationB.id === currentId) {
        names.push(seg.stationA.name);
        currentId = seg.stationA.id;
      } else {
        broken = true;
        break;
      }
    }
    return { names, currentId, broken };
  }, [selected, segById, data, game.start]);

  const usedIds = useMemo(() => new Set(selected), [selected]);
  const reachedDest = !path.broken && path.currentId === game.dest.id;

  const addSegment = (id) => {
    if (!usedIds.has(id) && !submitting) setSelected((prev) => [...prev, id]);
  };
  const undo = () => setSelected((prev) => prev.slice(0, -1));
  const clear = () => setSelected([]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Spinner animation="border" />;

  const timeColor = timeLeft <= 15 ? "danger" : timeLeft <= 30 ? "warning" : "secondary";

  return (
    <Card className="shadow-sm">
      <Card.Body>
        {/* Header: assigned start/dest + countdown */}
        <Row className="align-items-center mb-3">
          <Col>
            <h2 className="mb-0">Planning</h2>
            <div>
              From <Badge bg="success">{game.start.name}</Badge> to{" "}
              <Badge bg="danger">{game.dest.name}</Badge>
            </div>
          </Col>
          <Col xs="auto">
            <Badge bg={timeColor} style={{ fontSize: "1.25rem" }}>
              ⏱ {timeLeft}s
            </Badge>
          </Col>
        </Row>

        {/* The route built so far */}
        <Alert variant={reachedDest ? "success" : "light"} className="border">
          <strong>Your route:</strong> {path.names.join(" → ")}
          {path.broken && (
            <div className="text-danger">
              ⚠ This segment doesn't connect to your current station.
            </div>
          )}
          {reachedDest && <div className="text-success">✓ You have reached the destination.</div>}
        </Alert>

        {/* Segment picker */}
        <p className="text-muted mb-1">
          Select segments in order (each can be used once). The lines are hidden — rebuild
          them in your head.
        </p>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {data.segments.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={usedIds.has(s.id) ? "secondary" : "outline-primary"}
              disabled={usedIds.has(s.id) || submitting}
              onClick={() => addSegment(s.id)}
            >
              {s.stationA.name} — {s.stationB.name}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit route"}
          </Button>
          <Button variant="outline-secondary" onClick={undo} disabled={submitting || !selected.length}>
            Undo
          </Button>
          <Button variant="outline-secondary" onClick={clear} disabled={submitting || !selected.length}>
            Clear
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default PlanningPhase;
