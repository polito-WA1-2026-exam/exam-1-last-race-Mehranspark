// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";

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

// --- routes ---
// Smoke-test route: proves the client can reach the API across origins (CORS).
app.get("/api/test", (req, res) => {
  res.json({ message: "Last Race API is running", time: new Date().toISOString() });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
