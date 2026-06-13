// Data access for games and their execution steps.

import { dbAll, dbGet, dbRun } from "../db/database.js";

// Create a new pending game with the server-assigned start/destination.
// start_at records when Planning began (used later for the 90s timer check).
export async function createGame(userId, startStationId, destStationId, startAt) {
  const { lastID } = await dbRun(
    `INSERT INTO games (user_id, start_station_id, dest_station_id, status, start_at)
     VALUES (?, ?, ?, 'pending', ?)`,
    [userId, startStationId, destStationId, startAt]
  );
  return lastID;
}

// Load a single game (used to validate ownership + state on route submission).
export function getGameById(id) {
  return dbGet(
    `SELECT id, user_id, start_station_id, dest_station_id, score, status, start_at
       FROM games WHERE id = ?`,
    [id]
  );
}

// Finalize a game: 'completed' with the score, or 'failed' with score 0.
export function setGameResult(id, status, score) {
  return dbRun("UPDATE games SET status = ?, score = ? WHERE id = ?", [status, score, id]);
}

// Record one executed step of a valid route.
export function addGameStep(gameId, stepIndex, segmentId, eventId, coinsAfter) {
  return dbRun(
    `INSERT INTO game_steps (game_id, step_index, segment_id, event_id, coins_after)
     VALUES (?, ?, ?, ?, ?)`,
    [gameId, stepIndex, segmentId, eventId, coinsAfter]
  );
}

// Global ranking: each user's best completed-game score, highest first.
// Only 'completed' games count (failed games are 0 but we rank on real bests).
export function getRanking() {
  return dbAll(
    `SELECT u.username, u.name, MAX(g.score) AS bestScore
       FROM users u
       JOIN games g ON g.user_id = u.id
      WHERE g.status = 'completed'
      GROUP BY u.id
      ORDER BY bestScore DESC, u.username ASC`
  );
}
