// Randomly assign a start + destination station that are reachable and at least
// `minDistance` segments apart (the spec requires >= 3).

import { buildAdjacency, bfsDistances } from "../utils/graph.js";

// Fisher–Yates shuffle (returns a new array). Used to try start stations in a
// random order so the assignment is fair and terminates deterministically.
function shuffled(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// stationIds: array of all station ids. segments: [{stationAId, stationBId}].
// Returns { startId, destId } or null if no eligible pair exists (shouldn't
// happen on a valid seeded network).
export function pickStartDest(stationIds, segments, minDistance = 3) {
  const adj = buildAdjacency(segments);

  // Try each station as the start, in random order. For the first one that has at
  // least one station >= minDistance away, pick a random such destination.
  for (const start of shuffled(stationIds)) {
    const dist = bfsDistances(adj, start);
    const farEnough = [...dist.entries()]
      .filter(([id, d]) => id !== start && d >= minDistance)
      .map(([id]) => id);
    if (farEnough.length > 0) {
      const dest = farEnough[Math.floor(Math.random() * farEnough.length)];
      return { startId: start, destId: dest };
    }
  }
  return null;
}
