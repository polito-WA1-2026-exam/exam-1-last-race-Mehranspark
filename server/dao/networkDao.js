// Data access for the underground network (lines, stations, segments, interchanges).

import { dbAll } from "../db/database.js";

// All lines, with their colour. Used in Setup.
export function listLines() {
  return dbAll("SELECT id, name, color FROM lines ORDER BY name");
}

// All stations (id + name). Used in Setup and Planning.
export function listStations() {
  return dbAll("SELECT id, name FROM stations ORDER BY name");
}

// Full topology for the Setup map: each line with its stations in order.
// Returns [{ id, name, color, stations: [{ id, name, position }] }].
export async function getFullNetwork() {
  const lines = await listLines();
  const rows = await dbAll(
    `SELECT ls.line_id, ls.position, s.id AS station_id, s.name AS station_name
       FROM line_stations ls
       JOIN stations s ON s.id = ls.station_id
      ORDER BY ls.line_id, ls.position`
  );
  return lines.map((line) => ({
    ...line,
    stations: rows
      .filter((r) => r.line_id === line.id)
      .map((r) => ({ id: r.station_id, name: r.station_name, position: r.position })),
  }));
}

// The flat list of segments as station pairs, WITHOUT any line information.
// This is what the Planning phase sends to the client (the player must rebuild
// the lines mentally). Returns [{ id, stationA:{id,name}, stationB:{id,name} }].
export async function listSegmentsForPlanning() {
  const rows = await dbAll(
    `SELECT seg.id,
            a.id AS a_id, a.name AS a_name,
            b.id AS b_id, b.name AS b_name
       FROM segments seg
       JOIN stations a ON a.id = seg.station_a_id
       JOIN stations b ON b.id = seg.station_b_id
      ORDER BY a.name, b.name`
  );
  return rows.map((r) => ({
    id: r.id,
    stationA: { id: r.a_id, name: r.a_name },
    stationB: { id: r.b_id, name: r.b_name },
  }));
}

// Segments WITH the line(s) serving each one — server-side only, for the route
// validator. Returns [{ id, stationAId, stationBId, lineIds: [..] }].
export async function getSegmentsWithLines() {
  const rows = await dbAll(
    `SELECT seg.id, seg.station_a_id, seg.station_b_id, sl.line_id
       FROM segments seg
       JOIN segment_lines sl ON sl.segment_id = seg.id`
  );
  const byId = new Map();
  for (const r of rows) {
    if (!byId.has(r.id)) {
      byId.set(r.id, { id: r.id, stationAId: r.station_a_id, stationBId: r.station_b_id, lineIds: [] });
    }
    byId.get(r.id).lineIds.push(r.line_id);
  }
  return [...byId.values()];
}

// Ids of interchange stations: those served by more than one line.
export async function getInterchangeStationIds() {
  const rows = await dbAll(
    `SELECT station_id
       FROM line_stations
      GROUP BY station_id
     HAVING COUNT(DISTINCT line_id) > 1`
  );
  return rows.map((r) => r.station_id);
}
