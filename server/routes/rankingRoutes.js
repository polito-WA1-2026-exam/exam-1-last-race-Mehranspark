// Ranking route.
//   GET /api/ranking -> the global leaderboard: each user's best score.
//
// Protected (registered users only). Returns only public fields (name, username,
// best score) — never ids or credentials.

import express from "express";
import { isLoggedIn } from "../auth.js";
import { getRanking } from "../dao/gameDao.js";

const router = express.Router();

// Each user's best COMPLETED-game score, highest first (ties broken by username).
// Users who have never completed a game do not appear (they have no best score).
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: "Failed to load the ranking" });
  }
});

export default router;
