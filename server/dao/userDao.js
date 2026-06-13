// Data access for users / authentication.

import { dbGet } from "../db/database.js";
import { verifyPassword } from "../utils/password.js";

// Used by Passport's deserializeUser: load the safe user fields by id.
// Never returns salt/hash to the rest of the app.
export async function getUserById(id) {
  const row = await dbGet("SELECT id, username, name FROM users WHERE id = ?", [id]);
  return row; // undefined if not found
}

// Used by the Passport LocalStrategy: check username + password.
// Returns the safe user object on success, or false on wrong credentials.
export async function getUser(username, password) {
  const row = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
  if (!row) return false; // unknown username
  const ok = await verifyPassword(password, row.salt, row.hash);
  if (!ok) return false; // wrong password
  return { id: row.id, username: row.username, name: row.name };
}
