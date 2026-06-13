// Session routes: login, logout, and "who am I".
//
// We treat the logged-in session as a resource at /api/sessions:
//   POST   /api/sessions          -> log in (create a session)
//   GET    /api/sessions/current  -> read the current session's user
//   DELETE /api/sessions/current  -> log out (destroy the session)

import express from "express";
import { body, validationResult } from "express-validator";
import passport from "../auth.js";

const router = express.Router();

// POST /api/sessions  — log in.
// Validate the body first, then run Passport's local strategy with a custom
// callback so we can return a clean JSON error instead of Passport's default.
router.post(
  "/",
  body("username").isString().notEmpty(),
  body("password").isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid credentials format" });

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Wrong credentials" });
      // Establish the login session (sets the cookie). req.user is now set.
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(req.user); // safe fields only: { id, username, name }
      });
    })(req, res, next);
  }
);

// GET /api/sessions/current — return the logged-in user, or 401 if none.
router.get("/current", (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/sessions/current — log out and clear the session.
router.delete("/current", (req, res) => {
  req.logout(() => res.status(204).end());
});

export default router;
