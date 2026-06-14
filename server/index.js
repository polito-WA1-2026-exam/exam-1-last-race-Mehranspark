// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "./auth.js";
import authRoutes from "./routes/authRoutes.js";
import networkRoutes from "./routes/networkRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";

// init express
const app = new express();
const port = 3001;

// --- middleware ---
// request logging (development format)
app.use(morgan("dev"));
// parse JSON request bodies into req.body
app.use(express.json());

// CORS: "two servers" pattern. The React dev server (Vite) runs on a different
// origin (5173), so the browser blocks cross-origin requests unless we opt in.
// credentials:true lets the session cookie travel with requests; origin must be
// the exact client URL (not "*") for credentialed requests to be allowed.
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// --- session + authentication ---
// express-session stores the session server-side and sends the client a cookie
// holding only the session id. Passport then (de)serializes the user on top of it.
app.use(
  session({
    secret: "last-race-secret-key-change-me",
    resave: false, // don't re-save unchanged sessions
    saveUninitialized: false, // don't create a session until something is stored
    cookie: { httpOnly: true }, // cookie not readable from JS (mitigates XSS theft)
  })
);
app.use(passport.initialize());
app.use(passport.session());

// --- routes ---
// Smoke-test route: proves the client can reach the API across origins (CORS).
app.get("/api/test", (req, res) => {
  res.json({ message: "Last Race API is running", time: new Date().toISOString() });
});

app.use("/api/sessions", authRoutes);
app.use("/api", networkRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/ranking", rankingRoutes);

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
