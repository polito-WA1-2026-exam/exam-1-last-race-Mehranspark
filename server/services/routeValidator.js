// Route validation — the core game rule.
//
// A submitted route is an ORDERED list of segment ids. It is valid only if ALL
// of the following hold:
//   1. every id refers to a real segment, and no segment is used more than once;
//   2. the segments form a connected walk: each segment continues from the
//      station the previous one ended at;
//   3. the walk starts at the assigned start and ends at the assigned destination;
//   4. it is possible to ride the walk changing LINES only at interchange stations.
//
// Stations MAY be visited more than once; only segments may not repeat.
//
// Inputs:
//   submittedIds   : number[]                      (ordered segment ids)
//   startId, destId: number                        (assigned endpoints)
//   segmentsById   : Map<id,{stationAId,stationBId,lineIds:number[]}>
//   interchangeSet : Set<number>                   (interchange station ids)
//
// Returns { valid:true, directed:[{segmentId,fromId,toId}] }  on success,
//      or { valid:false, reason:string }                       on failure.

export function validateRoute(submittedIds, startId, destId, segmentsById, interchangeSet) {
  // --- 1a. non-empty ---
  if (!Array.isArray(submittedIds) || submittedIds.length === 0) {
    return { valid: false, reason: "The route is empty." };
  }

  // --- 1b. no repeated segment ---
  if (new Set(submittedIds).size !== submittedIds.length) {
    return { valid: false, reason: "A segment is used more than once." };
  }

  // --- 1c. every segment exists ---
  for (const id of submittedIds) {
    if (!segmentsById.has(id)) return { valid: false, reason: `Unknown segment (id ${id}).` };
  }

  // --- 2 & 3. reconstruct the directed walk and check endpoints ---
  // We walk from startId; each segment must touch the current station, and we
  // move to its other endpoint. The station where segment i-1 meets segment i is
  // recorded as the "junction" used for the line-change check below.
  const directed = [];
  let current = startId;
  for (let i = 0; i < submittedIds.length; i++) {
    const seg = segmentsById.get(submittedIds[i]);
    let next;
    if (current === seg.stationAId) next = seg.stationBId;
    else if (current === seg.stationBId) next = seg.stationAId;
    else {
      // The segment does not continue from where we are.
      const why = i === 0 ? "The route does not start at the assigned station." : "The route is broken: a segment does not connect to the previous one.";
      return { valid: false, reason: why };
    }
    directed.push({ segmentId: submittedIds[i], fromId: current, toId: next });
    current = next;
  }
  if (current !== destId) {
    return { valid: false, reason: "The route does not end at the destination." };
  }

  // --- 4. line-change feasibility (DP over the segments) ---
  // We must assign one serving line to each segment such that, between two
  // consecutive segments, the line either stays the same OR the junction station
  // is an interchange. `feasible` is the set of lines we could be travelling on
  // for the current segment given a valid assignment of all earlier segments.
  let feasible = new Set(segmentsById.get(submittedIds[0]).lineIds);
  for (let i = 1; i < submittedIds.length; i++) {
    const seg = segmentsById.get(submittedIds[i]);
    const junction = directed[i].fromId; // = directed[i-1].toId, the shared station
    const canChangeHere = interchangeSet.has(junction);

    const nextFeasible = new Set();
    for (const line of seg.lineIds) {
      // No line change: we may keep this line if it was feasible before.
      if (feasible.has(line)) nextFeasible.add(line);
      // Line change: allowed only at an interchange (any earlier line is fine).
      else if (canChangeHere && feasible.size > 0) nextFeasible.add(line);
    }
    if (nextFeasible.size === 0) {
      return { valid: false, reason: "A line change happens outside an interchange station." };
    }
    feasible = nextFeasible;
  }

  return { valid: true, directed };
}
