// Network + instructions routes.
//
// Two DIFFERENT views of the network, on purpose:
//   /api/network/full     -> Setup: stations + lines + connections (the whole map)
//   /api/network/planning -> Planning: stations + segment pairs ONLY, NO lines
// The planning view deliberately omits all line information so the player must
// rebuild the network mentally (and so the front-end never receives data it
// shouldn't have). Both require login.
//
// /api/instructions is the only PUBLIC endpoint: anonymous visitors may read the
// how-to-play text, but get no network data and no game functionality.

import express from "express";
import { isLoggedIn } from "../auth.js";
import { getFullNetwork, listStations, listSegmentsForPlanning } from "../dao/networkDao.js";

const router = express.Router();

// Setup map: full topology (lines with their ordered stations + colours).
router.get("/network/full", isLoggedIn, async (req, res) => {
  try {
    const lines = await getFullNetwork();
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: "Failed to load the network" });
  }
});

// Planning view: stations (id+name) + flat segment list as pairs, WITHOUT lines.
router.get("/network/planning", isLoggedIn, async (req, res) => {
  try {
    const [stations, segments] = await Promise.all([listStations(), listSegmentsForPlanning()]);
    res.json({ stations, segments });
  } catch (err) {
    res.status(500).json({ error: "Failed to load the planning network" });
  }
});

// Public instructions (no auth, no network data).
const INSTRUCTIONS = {
  title: "How to play Last Race",
  paragraphs: [
    "Last Race is a single-player game on a fictional underground network. Each game starts with 20 coins.",
    "You are given a random start and destination station, at least 3 segments apart. You have 90 seconds to study the list of station-to-station segments, rebuild the network in your head, and select a sequence of segments forming a valid route from start to destination.",
    "A route is valid if it begins and ends at the assigned stations, every step connects to the next, you change lines only at interchange stations, and you never reuse the same segment twice.",
    "When you submit, each segment of your journey triggers a random event that adds or removes coins. Your final score is the coins you have left (never below zero). An invalid or incomplete route scores zero.",
    "Log in to play and to appear on the global ranking of best scores.",
  ],
};

router.get("/instructions", (req, res) => {
  res.json(INSTRUCTIONS);
});

export default router;
