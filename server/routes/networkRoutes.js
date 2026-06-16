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
    "Each game starts with 20 coins.",
    "You have 90 seconds to plan a route from your start to your destination.",
    "Pick connected segments in order. Change line only at interchanges. No segment twice.",
    "Each segment gives a random event that changes your coins. An invalid route scores 0.",
    "Your best score is shown in the ranking.",
  ],
};

router.get("/instructions", (req, res) => {
  res.json(INSTRUCTIONS);
});

export default router;
