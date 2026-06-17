// Planning phase: the timed route-builder.
//
// The player sees the stations on the map (NO lines) and the full list of
// segments. They build a route by either clicking stations on the map or
// clicking a segment in the list — in both cases a pick is only accepted if it
// connects to where the route currently ends, so the route can never desync from
// the selection. A 90s ring counts down and auto-submits the route built so far.
//
// (Spec-faithful: stations-only map, full segment list shown, segments selected
// in sequence, lines hidden. The server is still the authority on validity.)

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
  const [error, setError] = useState(null); // fetch/submit error
  const [reject, setReject] = useState(null); // transient "can't add that" hint
  const [filter, setFilter] = useState(""); // search text over the segment list

  const submittedRef = useRef(false);
  const selectedRef = useRef(selected);
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

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft, handleSubmit]);

  const segById = useMemo(() => new Map((data?.segments ?? []).map((s) => [s.id, s])), [data]);
  const nameById = useMemo(
    () => new Map((data?.stations ?? []).map((s) => [s.id, s.name])),
    [data]
  );
  const usedIds = useMemo(() => new Set(selected), [selected]);

  // The route is always a connected walk (we only ever append connecting
  // segments), so reconstruction can't break.
  const path = useMemo(() => {
    let currentId = game.start.id;
    const names = [game.start.name];
    const ids = [game.start.id];
    for (const id of selected) {
      const seg = segById.get(id);
      if (!seg) break;
      const next = seg.stationA.id === currentId ? seg.stationB.id : seg.stationA.id;
      currentId = next;
      names.push(nameById.get(next));
      ids.push(next);
    }
    return { names, ids, currentId };
  }, [selected, segById, nameById, game.start]);

  const reachedDest = path.currentId === game.dest.id;
  const currentName = path.names[path.names.length - 1];

  // Filter the (always fully-listed) segments by the search text. This only helps
  // locate entries in the list — it reveals nothing the required list doesn't.
  const q = filter.trim().toLowerCase();
  const shownSegments = (data?.segments ?? []).filter(
    (s) => !q || `${s.stationA.name} ${s.stationB.name}`.toLowerCase().includes(q)
  );

  // Append the (unused) segment between the current station and `targetId`.
  const goToStation = (targetId) => {
    if (submitting || targetId === path.currentId) return;
    const seg = data.segments.find(
      (s) =>
        !usedIds.has(s.id) &&
        ((s.stationA.id === path.currentId && s.stationB.id === targetId) ||
          (s.stationB.id === path.currentId && s.stationA.id === targetId))
    );
    if (seg) {
      setSelected((p) => [...p, seg.id]);
      setReject(null);
    } else {
      setReject(`No segment from ${currentName} to ${nameById.get(targetId)}.`);
    }
  };

  // Click a segment in the list: accept only if it connects to the current stop.
  const pickSegment = (seg) => {
    if (submitting || usedIds.has(seg.id)) return;
    if (seg.stationA.id === path.currentId || seg.stationB.id === path.currentId) {
      setSelected((p) => [...p, seg.id]);
      setReject(null);
    } else {
      setReject(`That segment doesn't start at ${currentName}.`);
    }
  };

  const undo = () => {
    setSelected((p) => p.slice(0, -1));
    setReject(null);
  };
  const clear = () => {
    setSelected([]);
    setReject(null);
  };

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
              routePath={path.ids}
              currentId={path.currentId}
              onStationClick={goToStation}
            />
          </Col>
          <Col lg={5}>
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
              {reject && (
                <div className="mt-2" style={{ color: "var(--danger)" }}>⚠ {reject}</div>
              )}
              {!reject && !reachedDest && (
                <div className="mt-2 small" style={{ color: "var(--accent-2)" }}>
                  📍 You're at <strong>{currentName}</strong> — tap a neighbouring station, or pick a segment below.
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

        <div className="text-muted small mt-3 mb-2">
          Tap a station on the map, or pick a segment below. The lines are hidden — use the search to find your way.
        </div>

        {/* search / filter over the full segment list (helps locate, reveals nothing new) */}
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <input
            className="form-control form-control-sm"
            style={{ maxWidth: 260 }}
            placeholder="🔎 Search a station…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button size="sm" variant="outline-light" onClick={() => setFilter(currentName)}>
            📍 From {currentName}
          </Button>
          {filter && (
            <Button size="sm" variant="outline-secondary" onClick={() => setFilter("")}>
              Clear
            </Button>
          )}
          <span className="text-muted small ms-auto">
            {shownSegments.length} / {data.segments.length} segments
          </span>
        </div>

        <div className="lr-chips">
          {shownSegments.length === 0 && (
            <span className="text-muted small">No segments match “{filter}”.</span>
          )}
          {shownSegments.map((s) => (
            <span
              key={s.id}
              className={`lr-chip ${usedIds.has(s.id) ? "used" : ""}`}
              onClick={() => pickSegment(s)}
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
