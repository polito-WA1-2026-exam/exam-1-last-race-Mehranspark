// Planning phase: the timed route-builder.
//
// The player sees the stations positioned on the map (NO lines) and the flat list
// of segments as chips. A 90-second ring counts down; at zero the route built so
// far is auto-submitted. Each segment may be picked once, in sequence.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import API from "../API.js";
import NetworkMap from "./NetworkMap.jsx";
import CircularTimer from "./CircularTimer.jsx";

function PlanningPhase({ game, onSubmitted }) {
  const [data, setData] = useState(null); // { stations, segments }
  const [selected, setSelected] = useState([]); // ordered segment ids
  const [timeLeft, setTimeLeft] = useState(game.planningSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submittedRef = useRef(false); // submit at most once
  const selectedRef = useRef(selected); // latest selection for the timer's auto-submit
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    API.getPlanningNetwork()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

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

  // One interval for the whole phase; cleared on unmount.
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-submit when the clock hits zero.
  useEffect(() => {
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft, handleSubmit]);

  const segById = useMemo(
    () => new Map((data?.segments ?? []).map((s) => [s.id, s])),
    [data]
  );

  // Reconstruct the directed walk from the selected segments (names + ids + state).
  const path = useMemo(() => {
    if (!data) return { names: [], ids: [game.start.id], currentId: game.start.id, broken: false };
    let currentId = game.start.id;
    const names = [game.start.name];
    const ids = [game.start.id];
    let broken = false;
    for (const id of selected) {
      const seg = segById.get(id);
      if (!seg) { broken = true; break; }
      if (seg.stationA.id === currentId) { names.push(seg.stationB.name); currentId = seg.stationB.id; }
      else if (seg.stationB.id === currentId) { names.push(seg.stationA.name); currentId = seg.stationA.id; }
      else { broken = true; break; }
      ids.push(currentId);
    }
    return { names, ids, currentId, broken };
  }, [selected, segById, data, game.start]);

  const usedIds = useMemo(() => new Set(selected), [selected]);
  const reachedDest = !path.broken && path.currentId === game.dest.id;

  const addSegment = (id) => { if (!usedIds.has(id) && !submitting) setSelected((p) => [...p, id]); };
  const undo = () => setSelected((p) => p.slice(0, -1));
  const clear = () => setSelected([]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Card>
      <Card.Body>
        <Row className="align-items-center g-3 mb-2">
          <Col>
            <h2 className="mb-1">Plan your route</h2>
            <div>
              <span className="badge rounded-pill" style={{ background: "var(--success)", color: "#06281c" }}>
                ● {game.start.name}
              </span>
              <span className="mx-2 text-muted">→</span>
              <span className="badge rounded-pill" style={{ background: "var(--danger)", color: "#2a0d14" }}>
                ◎ {game.dest.name}
              </span>
            </div>
          </Col>
          <Col xs="auto">
            <CircularTimer timeLeft={timeLeft} total={game.planningSeconds} />
          </Col>
        </Row>

        <Row className="g-3">
          <Col lg={7}>
            <NetworkMap
              stations={data.stations}
              startId={game.start.id}
              destId={game.dest.id}
              routeStationIds={path.ids}
            />
          </Col>
          <Col lg={5}>
            {/* the route being built */}
            <div className="lr-panel p-3 mb-3">
              <div className="text-muted small mb-1">Your route</div>
              <div className="lr-route">
                {path.names.map((n, i) => (
                  <span key={i} style={{ display: "contents" }}>
                    {i > 0 && <span className="arrow">→</span>}
                    <span className="stop">{n}</span>
                  </span>
                ))}
              </div>
              {path.broken && (
                <div className="mt-2" style={{ color: "var(--danger)" }}>
                  ⚠ That segment doesn't connect here.
                </div>
              )}
              {reachedDest && (
                <div className="mt-2" style={{ color: "var(--success)" }}>
                  ✓ Destination reached — submit when ready!
                </div>
              )}
            </div>

            <div className="d-flex gap-2 mb-3">
              <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="flex-grow-1">
                {submitting ? "Submitting…" : "🚆 Submit route"}
              </Button>
              <Button variant="outline-light" onClick={undo} disabled={submitting || !selected.length}>
                Undo
              </Button>
              <Button variant="outline-light" onClick={clear} disabled={submitting || !selected.length}>
                Clear
              </Button>
            </div>
          </Col>
        </Row>

        <div className="text-muted small mt-2 mb-1">
          Pick segments in order (each once). The lines are hidden — rebuild them from memory.
        </div>
        <div className="lr-chips">
          {data.segments.map((s) => (
            <span
              key={s.id}
              className={`lr-chip ${usedIds.has(s.id) ? "used" : ""}`}
              onClick={() => addSegment(s.id)}
            >
              {s.stationA.name} — {s.stationB.name}
            </span>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

export default PlanningPhase;
