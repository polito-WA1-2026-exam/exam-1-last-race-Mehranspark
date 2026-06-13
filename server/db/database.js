// SQLite connection + thin Promise wrappers.
//
// The `sqlite3` driver is callback-based (the course's L06/L07 material). To use
// async/await everywhere else, we wrap the three primitive operations in Promises
// once, here, and every DAO builds on these helpers.

import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";

// Resolve the DB file relative to THIS file, so it works regardless of the
// directory the server is launched from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "lastrace.sqlite");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) throw err;
  // Enforce foreign keys (off by default in SQLite, per connection).
  db.run("PRAGMA foreign_keys = ON");
});

// Run a query returning ALL matching rows.
export const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// Run a query returning a SINGLE row (or undefined).
export const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

// Run an INSERT/UPDATE/DELETE. Resolves with { lastID, changes }.
// Note: uses a normal function (not arrow) so `this` is the sqlite statement.
export const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

// Execute a multi-statement SQL script (used by the seed to apply schema.sql).
export const dbExec = (sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });

export default db;
