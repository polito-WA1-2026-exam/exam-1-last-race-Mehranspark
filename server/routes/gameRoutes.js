// Game lifecycle routes.
//   POST /api/games            -> start a new game (server assigns start/dest)
//   POST /api/games/:id/route  -> submit the planned route; validate + execute
//
// Everything that determines the outcome (start/dest, validation, events, score)
// happens HERE, on the server. The client never decides results.

import express from "express";
import { body, param, validationResult } from "express-validator";
import { isLoggedIn } from "../auth.js";
import {
  listStations,
  getSegmentsWithLines,
  getInterchangeStationIds,
} from "../dao/networkDao.js";
import { getRandomEvent } from "../dao/eventDao.js";
import {
  createGame,
  getGameById,
  setGameResult,
  addGameStep,
} from "../dao/gameDao.js";
import { pickStartDest } from "../services/assignStations.js";
import { validateRoute } from "../services/routeValidator.js";

const router = express.Router();

const STARTING_COINS = 20;
const PLANNING_SECONDS = 90;
const GRACE_SECONDS = 5; // allowance for network latency on the auto-submit

// Helper: load segments keyed by id (for validation/execution).
async function loadSegmentsById() {
  const segments = await getSegmentsWithLines();
  return new Map(segments.map((s) => [s.id, s]));
}

// POST /api/games — create a new pending game with a server-assigned start/dest.
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const stations = await listStations();
    const segments = await getSegmentsWithLines();
    const pair = pickStartDest(stations.map((s) => s.id), segments, 3);
    if (!pair) return res.status(500).json({ error: "Could not assign stations" });

    const nameById = new Map(stations.map((s) => [s.id, s.name]));
    const startAt = new Date().toISOString();
    const gameId = await createGame(req.user.id, pair.startId, pair.destId, startAt);

    res.status(201).json({
      id: gameId,
      start: { id: pair.startId, name: nameById.get(pair.startId) },
      dest: { id: pair.destId, name: nameById.get(pair.destId) },
      planningSeconds: PLANNING_SECONDS,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to start a new game" });
  }
});

// POST /api/games/:id/route — submit the route, validate it, and (if valid) run
// the execution applying one random event per segment.
router.post(
  "/:id/route",
  isLoggedIn,
  param("id").isInt(),
  body("segments").isArray(), // ordered list of segment ids (may be empty/incomplete)
  body("segments.*").isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid request format" });

    try {
      const gameId = Number(req.params.id);
      const game = await getGameById(gameId);

      // Authorisation + state checks.
      if (!game) return res.status(404).json({ error: "Game not found" });
      if (game.user_id !== req.user.id) return res.status(403).json({ error: "Not your game" });
      if (game.status !== "pending") return res.status(409).json({ error: "Game already finished" });

      const submittedIds = req.body.segments.map(Number);

      // Timer note: the 90s countdown is enforced on the client, which auto-submits
      // at zero. The server records start_at and computes the elapsed time so a
      // late submission can be recognised; per the spec we still validate the route
      // built up to that point (the outcome of a too-slow plan is simply an
      // invalid/incomplete route -> score 0).
      const elapsed = (Date.now() - new Date(game.start_at).getTime()) / 1000;
      const timedOut = elapsed > PLANNING_SECONDS + GRACE_SECONDS;

      // Validate.
      const segmentsById = await loadSegmentsById();
      const interchangeSet = new Set(await getInterchangeStationIds());
      const result = validateRoute(
        submittedIds,
        game.start_station_id,
        game.dest_station_id,
        segmentsById,
        interchangeSet
      );

      // Invalid / incomplete -> skip execution, lose all coins (score 0).
      if (!result.valid) {
        await setGameResult(gameId, "failed", 0);
        return res.json({ valid: false, reason: result.reason, score: 0, timedOut });
      }

      // Valid -> execute segment by segment, applying one random event each.
      const stations = await listStations();
      const nameById = new Map(stations.map((s) => [s.id, s.name]));
      let coins = STARTING_COINS;
      const steps = [];
      for (let i = 0; i < result.directed.length; i++) {
        const step = result.directed[i];
        const event = await getRandomEvent();
        coins += event.effect;
        await addGameStep(gameId, i, step.segmentId, event.id, coins);
        steps.push({
          index: i,
          from: nameById.get(step.fromId),
          to: nameById.get(step.toId),
          event: { description: event.description, effect: event.effect },
          coinsAfter: coins,
        });
      }

      // Final score: coins remaining, never below zero.
      const score = Math.max(0, coins);
      await setGameResult(gameId, "completed", score);

      res.json({ valid: true, steps, score, timedOut });
    } catch (err) {
      res.status(500).json({ error: "Failed to process the route" });
    }
  }
);

export default router;
