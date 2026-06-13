// Passport.js configuration (the L11 "cookbook" pattern) + the route guard.
//
// LocalStrategy verifies a username/password against the database. On success
// Passport stores ONLY the user id in the session (serializeUser); on each later
// request it reloads the safe user object from that id (deserializeUser).

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getUser, getUserById } from "./dao/userDao.js";

// How to check a login attempt. `done(null, user)` = success;
// `done(null, false, info)` = bad credentials; `done(err)` = unexpected error.
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUser(username, password);
      if (!user) return done(null, false, { message: "Incorrect username or password." });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// What to put in the session cookie's server-side record: just the id (minimal).
passport.serializeUser((user, done) => done(null, user.id));

// Rebuild the user object from the stored id on every authenticated request.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user); // becomes req.user
  } catch (err) {
    done(err);
  }
});

// Route guard: allow only authenticated requests through; otherwise 401.
export function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authenticated" });
}

export default passport;
