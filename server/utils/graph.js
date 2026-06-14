// Generic graph helpers over the station network.
// The network is an undirected graph: nodes = stations, edges = segments.

// Build an adjacency map: stationId -> [neighbouring stationIds].
// `segments` are objects with stationAId / stationBId.
export function buildAdjacency(segments) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  };
  for (const s of segments) {
    add(s.stationAId, s.stationBId);
    add(s.stationBId, s.stationAId);
  }
  return adj;
}

// Breadth-first search from `src`. Returns a Map stationId -> distance in segments.
// BFS visits the graph level by level, so the first time a node is reached is via
// a shortest path — exactly the "minimum distance in stops segments" the spec needs.
export function bfsDistances(adj, src) {
  const dist = new Map([[src, 0]]);
  const queue = [src];
  while (queue.length > 0) {
    const u = queue.shift();
    for (const v of adj.get(u) ?? []) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u) + 1);
        queue.push(v);
      }
    }
  }
  return dist;
}
