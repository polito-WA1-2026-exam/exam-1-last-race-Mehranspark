-- Last Race — database schema
-- Run by seed.js (drops and recreates everything, then re-populates).

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS game_steps;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS segment_lines;
DROP TABLE IF EXISTS segments;
DROP TABLE IF EXISTS line_stations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS lines;
DROP TABLE IF EXISTS users;

-- Registered players. Password is stored salted + hashed (scrypt); the plaintext
-- is never persisted. salt and hash are hex strings.
CREATE TABLE users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name     TEXT NOT NULL,
  salt     TEXT NOT NULL,
  hash     TEXT NOT NULL
);

-- Metro lines. name is unique; color is used to draw the map in Setup.
CREATE TABLE lines (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

-- Stations. name is unique across the whole network. x/y give the station's
-- position on the map drawing (part of the network layout, served by the API).
CREATE TABLE stations (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  x    INTEGER NOT NULL,
  y    INTEGER NOT NULL
);

-- Ordered membership of a station on a line (position = order along the line).
-- This is the source of truth for line topology; segments are derived from it.
-- A station appearing in rows with >1 distinct line_id is an INTERCHANGE.
CREATE TABLE line_stations (
  line_id    INTEGER NOT NULL REFERENCES lines(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),
  position   INTEGER NOT NULL,
  PRIMARY KEY (line_id, station_id)
);

-- An undirected connection between two adjacent stations (a "segment" the player
-- selects). Stored canonically with station_a_id < station_b_id so each physical
-- pair has exactly one row (and the UNIQUE constraint prevents duplicates).
CREATE TABLE segments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  station_a_id INTEGER NOT NULL REFERENCES stations(id),
  station_b_id INTEGER NOT NULL REFERENCES stations(id),
  UNIQUE (station_a_id, station_b_id),
  CHECK (station_a_id < station_b_id)
);

-- Which line(s) serve a given segment. A pair shared by two lines would have two
-- rows here; in this network every segment is served by exactly one line, but the
-- schema (and the route validator) handle the general many-lines case.
CREATE TABLE segment_lines (
  segment_id INTEGER NOT NULL REFERENCES segments(id),
  line_id    INTEGER NOT NULL REFERENCES lines(id),
  PRIMARY KEY (segment_id, line_id)
);

-- Random events applied during Execution. effect is an integer in [-4, +4].
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  effect      INTEGER NOT NULL CHECK (effect BETWEEN -4 AND 4)
);

-- One row per played game.
--   status: 'pending'  = created, route not yet submitted
--           'completed' = valid route executed, score computed
--           'failed'    = invalid/incomplete route, score forced to 0
--   start_at: when the Planning phase began (used for the 90s timer check).
CREATE TABLE games (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  start_station_id INTEGER NOT NULL REFERENCES stations(id),
  dest_station_id  INTEGER NOT NULL REFERENCES stations(id),
  score           INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'failed')),
  start_at        TEXT NOT NULL
);

-- Per-segment execution log: which event hit on each step and the running total.
-- Lets the Result/Execution view be fully server-authoritative and replayable.
CREATE TABLE game_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     INTEGER NOT NULL REFERENCES games(id),
  step_index  INTEGER NOT NULL,
  segment_id  INTEGER NOT NULL REFERENCES segments(id),
  event_id    INTEGER NOT NULL REFERENCES events(id),
  coins_after INTEGER NOT NULL,
  UNIQUE (game_id, step_index)
);
