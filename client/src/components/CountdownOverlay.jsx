// A short "3 · 2 · 1 · Go!" countdown shown right before the Planning phase.
// It schedules the whole sequence once on mount and calls onDone at the end.
// onDone is kept in a ref so a changing prop identity can't restart the sequence,
// and all timers are cleared on unmount.

import { useState, useEffect, useRef } from "react";

function CountdownOverlay({ onDone }) {
  const [n, setN] = useState(3); // 3 -> 2 -> 1 -> 0 (0 shows "Go!")
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setN(2), 900),
      setTimeout(() => setN(1), 1800),
      setTimeout(() => setN(0), 2700),
      setTimeout(() => doneRef.current(), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lr-panel lr-countdown">
      <div className="cd-sub">{n > 0 ? "Get ready" : "Plan your route!"}</div>
      {/* key={n} re-triggers the pop animation on each change */}
      <div className={`cd-num ${n === 0 ? "go" : ""}`} key={n}>
        {n > 0 ? n : "Go!"}
      </div>
    </div>
  );
}

export default CountdownOverlay;
