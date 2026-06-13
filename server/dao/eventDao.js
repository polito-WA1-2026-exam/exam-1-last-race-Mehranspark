// Data access for events.

import { dbAll, dbGet } from "../db/database.js";

// All events. Kept server-side; the client only ever sees the events that
// actually occurred during Execution (returned per step), not the full table.
export function listEvents() {
  return dbAll("SELECT id, description, effect FROM events ORDER BY id");
}

// Pick one event at random (used once per segment during Execution).
// ORDER BY RANDOM() LIMIT 1 lets SQLite do the random selection.
export function getRandomEvent() {
  return dbGet("SELECT id, description, effect FROM events ORDER BY RANDOM() LIMIT 1");
}
