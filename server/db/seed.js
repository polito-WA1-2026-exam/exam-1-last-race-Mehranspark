// Seed script — (re)creates the database file and populates it.
//
// Run with:  node db/seed.js   (or:  npm run seed)  from the server/ directory.
//
// The network is defined once, declaratively, below. Segments, segment_lines and
// interchanges are DERIVED from it, so the data can never drift out of sync.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dbExec, dbRun, dbAll } from "./database.js";
import { hashPassword } from "../utils/password.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- 1. Network definition (the single source of truth) ---
// Each line lists its stations in physical order. Shared stations create
// interchanges automatically.
const LINES = [
  { name: "Amber Line",   color: "#C75B12", stations: ["Aurora Centrale", "Ember Quay", "Meridian Cross", "Irongate", "Lumen Park"] },
  { name: "Cobalt Line",  color: "#1F4E79", stations: ["Aurora Centrale", "Saltmarket", "Meridian Cross", "Halcyon Bay", "Nimbus Fields"] },
  { name: "Verde Line",   color: "#2E7D32", stations: ["Lumen Park", "Verdant Hollow", "Meridian Cross", "Obsidian Court", "Thornwood"] },
  { name: "Saffron Line", color: "#E0A800", stations: ["Nimbus Fields", "Obsidian Court", "Mistral Heights", "Glasshouse", "Solace Gardens"] },
];

// --- Station coordinates for the map drawing (viewBox ~ 800 x 680). ---
// Meridian Cross is the central hub (on 3 lines); the four lines radiate from it.
const COORDS = {
  "Aurora Centrale": { x: 110, y: 250 },
  "Ember Quay": { x: 265, y: 290 },
  "Meridian Cross": { x: 420, y: 330 },
  Irongate: { x: 565, y: 300 },
  "Lumen Park": { x: 710, y: 250 },
  Saltmarket: { x: 235, y: 110 },
  "Halcyon Bay": { x: 545, y: 470 },
  "Nimbus Fields": { x: 615, y: 590 },
  "Verdant Hollow": { x: 625, y: 160 },
  "Obsidian Court": { x: 440, y: 500 },
  Thornwood: { x: 405, y: 635 },
  "Mistral Heights": { x: 295, y: 530 },
  Glasshouse: { x: 185, y: 590 },
  "Solace Gardens": { x: 105, y: 645 },
};

// --- 2. Events (>=8, effects in [-4, +4]) ---
const EVENTS = [
  { description: "Quiet journey — nothing happens.", effect: 0 },
  { description: "A kind passenger shares a travel tip.", effect: 1 },
  { description: "Found a coin wedged in the seat.", effect: 1 },
  { description: "A busker's tune brightens the carriage.", effect: 2 },
  { description: "Express service — a wonderfully smooth ride.", effect: 3 },
  { description: "Festival crowd hands out free tokens.", effect: 4 },
  { description: "Ticket inspector issues a small fine.", effect: -1 },
  { description: "Wrong platform — you miss a connection.", effect: -2 },
  { description: "A pickpocket works the crowded train.", effect: -3 },
  { description: "Signal failure causes a long, costly delay.", effect: -4 },
];

// --- 3. Users (>=3). Plaintext passwords are listed for the README. ---
const USERS = [
  { username: "alice", name: "Alice Romano",   password: "alice2026" },
  { username: "bob",   name: "Bob Ferraro",    password: "bob2026" },
  { username: "carla", name: "Carla Greco",    password: "carla2026" },
];

// --- 4. Pre-played games for the ranking (>=2 users with completed games). ---
// start/dest are station names resolved to ids during seeding.
const SEED_GAMES = [
  { username: "alice", start: "Aurora Centrale", dest: "Lumen Park",   score: 24, status: "completed" },
  { username: "alice", start: "Solace Gardens",  dest: "Aurora Centrale", score: 17, status: "completed" },
  { username: "bob",   start: "Thornwood",       dest: "Aurora Centrale", score: 19, status: "completed" },
  { username: "bob",   start: "Nimbus Fields",   dest: "Ember Quay",    score: 0,  status: "failed" },
];

async function seed() {
  // Apply the schema (drops + recreates all tables).
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await dbExec(schema);

  // --- stations: collect the unique set, preserving first-seen order ---
  const stationNames = [];
  for (const line of LINES)
    for (const s of line.stations) if (!stationNames.includes(s)) stationNames.push(s);

  const stationId = new Map(); // name -> id
  for (const name of stationNames) {
    const pos = COORDS[name];
    if (!pos) throw new Error(`Missing coordinates for station "${name}"`);
    const { lastID } = await dbRun("INSERT INTO stations (name, x, y) VALUES (?, ?, ?)", [
      name,
      pos.x,
      pos.y,
    ]);
    stationId.set(name, lastID);
  }

  // --- lines + ordered line_stations ---
  const lineId = new Map(); // name -> id
  for (const line of LINES) {
    const { lastID } = await dbRun("INSERT INTO lines (name, color) VALUES (?, ?)", [line.name, line.color]);
    lineId.set(line.name, lastID);
    for (let pos = 0; pos < line.stations.length; pos++) {
      await dbRun("INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)", [
        lastID,
        stationId.get(line.stations[pos]),
        pos,
      ]);
    }
  }

  // --- segments + segment_lines (derived from consecutive stations) ---
  // Canonical key "a-b" with a<b so a pair shared by two lines maps to one segment.
  const segmentId = new Map(); // "a-b" -> segment id
  for (const line of LINES) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const id1 = stationId.get(line.stations[i]);
      const id2 = stationId.get(line.stations[i + 1]);
      const [a, b] = id1 < id2 ? [id1, id2] : [id2, id1];
      const key = `${a}-${b}`;
      if (!segmentId.has(key)) {
        const { lastID } = await dbRun(
          "INSERT INTO segments (station_a_id, station_b_id) VALUES (?, ?)",
          [a, b]
        );
        segmentId.set(key, lastID);
      }
      await dbRun("INSERT INTO segment_lines (segment_id, line_id) VALUES (?, ?)", [
        segmentId.get(key),
        lineId.get(line.name),
      ]);
    }
  }

  // --- events ---
  for (const e of EVENTS)
    await dbRun("INSERT INTO events (description, effect) VALUES (?, ?)", [e.description, e.effect]);

  // --- users (salted + hashed passwords) ---
  const userId = new Map();
  for (const u of USERS) {
    const { salt, hash } = await hashPassword(u.password);
    const { lastID } = await dbRun(
      "INSERT INTO users (username, name, salt, hash) VALUES (?, ?, ?, ?)",
      [u.username, u.name, salt, hash]
    );
    userId.set(u.username, lastID);
  }

  // --- pre-played games ---
  for (const g of SEED_GAMES) {
    await dbRun(
      `INSERT INTO games (user_id, start_station_id, dest_station_id, score, status, start_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId.get(g.username),
        stationId.get(g.start),
        stationId.get(g.dest),
        g.score,
        g.status,
        new Date().toISOString(),
      ]
    );
  }

  return { stationNames, stationId };
}

// --- 5. Sanity checks: assert every "at least" requirement + connectivity ---
async function validate(stationId) {
  const [lines] = await dbAll("SELECT COUNT(*) AS n FROM lines");
  const [stations] = await dbAll("SELECT COUNT(*) AS n FROM stations");
  const [events] = await dbAll("SELECT COUNT(*) AS n FROM events");
  const [users] = await dbAll("SELECT COUNT(*) AS n FROM users");
  const interchanges = await dbAll(
    `SELECT station_id FROM line_stations GROUP BY station_id HAVING COUNT(DISTINCT line_id) > 1`
  );
  const usersWithGames = await dbAll(
    `SELECT COUNT(DISTINCT user_id) AS n FROM games WHERE status = 'completed'`
  );

  // Build the undirected graph from segments to check connectivity (BFS) and
  // confirm at least one start/dest pair is >=3 segments apart.
  const segs = await dbAll("SELECT station_a_id, station_b_id FROM segments");
  const adj = new Map();
  for (const id of stationId.values()) adj.set(id, []);
  for (const s of segs) {
    adj.get(s.station_a_id).push(s.station_b_id);
    adj.get(s.station_b_id).push(s.station_a_id);
  }
  const bfs = (src) => {
    const dist = new Map([[src, 0]]);
    const queue = [src];
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj.get(u)) if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); queue.push(v); }
    }
    return dist;
  };
  const allIds = [...stationId.values()];
  const reachable = bfs(allIds[0]);
  const connected = reachable.size === allIds.length;
  // Count ordered start/dest pairs with shortest distance >= 3.
  let pairsGte3 = 0;
  let maxDist = 0;
  for (const src of allIds) {
    const d = bfs(src);
    for (const [, dist] of d) {
      if (dist >= 3) pairsGte3++;
      if (dist > maxDist) maxDist = dist;
    }
  }

  const interchangeCount = interchanges.length;
  const stationCount = stations.n;
  const checks = [
    ["lines >= 4", lines.n >= 4, lines.n],
    ["stations >= 12", stationCount >= 12, stationCount],
    ["interchanges >= 3", interchangeCount >= 3, interchangeCount],
    ["interchanges <= half of stations", interchangeCount <= Math.floor(stationCount / 2), `${interchangeCount} <= ${Math.floor(stationCount / 2)}`],
    ["events >= 8", events.n >= 8, events.n],
    ["users >= 3", users.n >= 3, users.n],
    ["users with completed games >= 2", usersWithGames[0].n >= 2, usersWithGames[0].n],
    ["network is connected", connected, connected],
    ["exists a pair >= 3 segments apart", pairsGte3 > 0, `${pairsGte3} pairs, max dist ${maxDist}`],
  ];

  console.log("\nSeed summary & constraint checks:");
  let allOk = true;
  for (const [label, ok, value] of checks) {
    console.log(`  ${ok ? "✅" : "❌"} ${label}  (${value})`);
    if (!ok) allOk = false;
  }
  return allOk;
}

seed()
  .then(({ stationId }) => validate(stationId))
  .then((ok) => {
    if (ok) {
      console.log("\n✅ Database seeded successfully.\n");
      process.exit(0);
    } else {
      console.error("\n❌ Seed produced data that violates a requirement. Fix the network definition.\n");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
