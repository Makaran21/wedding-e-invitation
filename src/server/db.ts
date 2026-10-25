import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from 'astro:env/server';

export type WishStatus = 'pending' | 'approved' | 'rejected';

export interface GuestRow { id: number; token: string; name: string; created_at: string }
export interface WishRow {
  id: number; guest_id: number | null; name: string; message: string; status: WishStatus;
  ip: string; claim: string; created_at: string; decided_at: string | null; tg_message_id: number | null;
  /** A change the guest made after approval, waiting for approval itself; the approved text shows meanwhile. */
  edit_message: string | null; edit_at: string | null; tg_edit_message_id: number | null;
  /** Why the wish (status rejected) or the guest's last edit (status approved) wasn't approved; the guest sees it. */
  reason: string | null;
}

let db: DatabaseSync | undefined;

/** The database, created and migrated on first use. */
export function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY,
      guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      ip TEXT NOT NULL,
      claim TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at TEXT,
      tg_message_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS wishes_status ON wishes(status, created_at);
    CREATE INDEX IF NOT EXISTS wishes_guest ON wishes(guest_id);
    CREATE INDEX IF NOT EXISTS wishes_ip ON wishes(ip);
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  // Columns added after the first release.
  const columns = new Set((db.prepare('PRAGMA table_info(wishes)').all() as { name: string }[]).map((c) => c.name));
  for (const [name, type] of [['edit_message', 'TEXT'], ['edit_at', 'TEXT'], ['tg_edit_message_id', 'INTEGER'], ['reason', 'TEXT']]) {
    if (!columns.has(name)) db.exec(`ALTER TABLE wishes ADD COLUMN ${name} ${type}`);
  }
  return db;
}

/** A random, URL-safe token of `bytes` bytes of entropy. */
export const newToken = (bytes = 9) => randomBytes(bytes).toString('base64url');

// ---------- Guests ----------

export function guestByToken(token: string): GuestRow | undefined {
  return getDb().prepare('SELECT * FROM guests WHERE token = ?').get(token) as GuestRow | undefined;
}

export function listGuests() {
  return getDb().prepare(`
    SELECT g.*, w.id AS wish_id, w.status AS wish_status
    FROM guests g
    LEFT JOIN wishes w ON w.id = (SELECT id FROM wishes WHERE guest_id = g.id ORDER BY id DESC LIMIT 1)
    ORDER BY g.id DESC
  `).all() as unknown as (GuestRow & { wish_id: number | null; wish_status: WishStatus | null })[];
}

export function addGuests(names: string[]): GuestRow[] {
  const insert = getDb().prepare('INSERT INTO guests (token, name) VALUES (?, ?) RETURNING *');
  return names.map((name) => insert.get(newToken(), name) as unknown as GuestRow);
}

export function renameGuest(id: number, name: string): boolean {
  return getDb().prepare('UPDATE guests SET name = ? WHERE id = ?').run(name, id).changes > 0;
}

export function deleteGuest(id: number): boolean {
  return getDb().prepare('DELETE FROM guests WHERE id = ?').run(id).changes > 0;
}

// ---------- Wishes ----------

/** A guest's (or, for public guests, an IP's) wish that still counts: pending or approved. */
export function activeWishFor(by: { guestId: number } | { ip: string }): WishRow | undefined {
  const [where, value] = 'guestId' in by ? ['guest_id = ?', by.guestId] : ['guest_id IS NULL AND ip = ?', by.ip];
  return getDb().prepare(`SELECT * FROM wishes WHERE ${where} AND status != 'rejected' ORDER BY id DESC LIMIT 1`)
    .get(value) as WishRow | undefined;
}

export function addWish(w: { guestId: number | null; name: string; message: string; ip: string }): WishRow {
  return getDb().prepare(`
    INSERT INTO wishes (guest_id, name, message, ip, claim) VALUES (?, ?, ?, ?, ?) RETURNING *
  `).get(w.guestId, w.name, w.message, w.ip, newToken(12)) as unknown as WishRow;
}

export function wishById(id: number): WishRow | undefined {
  return getDb().prepare('SELECT * FROM wishes WHERE id = ?').get(id) as WishRow | undefined;
}

export function wishByClaim(claim: string): WishRow | undefined {
  return getDb().prepare('SELECT * FROM wishes WHERE claim = ?').get(claim) as WishRow | undefined;
}

export function latestWishOfGuest(guestId: number): WishRow | undefined {
  return getDb().prepare('SELECT * FROM wishes WHERE guest_id = ? ORDER BY id DESC LIMIT 1').get(guestId) as WishRow | undefined;
}

export function approvedWishes(limit = 300) {
  return getDb().prepare(`
    SELECT id, name, message, created_at FROM wishes WHERE status = 'approved' ORDER BY id DESC LIMIT ?
  `).all(limit) as Pick<WishRow, 'id' | 'name' | 'message' | 'created_at'>[];
}

/** Wishes for the admin panel. "pending" also takes in approved wishes with an edit waiting. */
export function listWishes(status?: WishStatus) {
  const db = getDb();
  const order = 'ORDER BY COALESCE(edit_at, created_at) DESC, id DESC';
  if (!status) return db.prepare(`SELECT * FROM wishes ${order}`).all() as unknown as WishRow[];
  const where = status === 'pending' ? "status = 'pending' OR edit_message IS NOT NULL" : 'status = ?';
  const stmt = db.prepare(`SELECT * FROM wishes WHERE ${where} ${order}`);
  return (status === 'pending' ? stmt.all() : stmt.all(status)) as unknown as WishRow[];
}

/** How many wishes are in each state, and in all; "pending" counts waiting edits too. */
export function wishCounts(): Record<WishStatus | 'all', number> {
  return getDb().prepare(`
    SELECT
      COALESCE(SUM(status = 'pending' OR edit_message IS NOT NULL), 0) AS pending,
      COALESCE(SUM(status = 'approved'), 0) AS approved,
      COALESCE(SUM(status = 'rejected'), 0) AS rejected,
      COUNT(*) AS "all"
    FROM wishes
  `).get() as unknown as Record<WishStatus | 'all', number>;
}

/**
 * The guest changes their wish. Pending: the text is simply replaced. Rejected: replaced and sent
 * for approval again. Approved: kept as is, with the new text waiting for approval as an edit
 * (sending back the approved text withdraws the edit).
 */
export function editWish(id: number, message: string): WishRow | undefined {
  const db = getDb();
  const wish = wishById(id);
  if (!wish) return undefined;
  if (wish.status !== 'approved') {
    return db.prepare(`
      UPDATE wishes SET message = ?, status = 'pending', decided_at = NULL, edit_message = NULL, edit_at = NULL, reason = NULL
      WHERE id = ? RETURNING *
    `).get(message, id) as unknown as WishRow;
  }
  const edit = message === wish.message ? null : message;
  return db.prepare(`
    UPDATE wishes SET edit_message = ?, edit_at = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END, reason = NULL
    WHERE id = ? RETURNING *
  `).get(edit, edit, id) as unknown as WishRow;
}

/** Approves (the new text replaces the old) or rejects (the old text stays, with the reason) a waiting edit. */
export function decideEdit(id: number, approve: boolean, reason: string | null = null): WishRow | undefined {
  const a = approve ? 1 : 0;
  return getDb().prepare(`
    UPDATE wishes SET
      message = CASE WHEN ? THEN COALESCE(edit_message, message) ELSE message END,
      decided_at = CASE WHEN ? THEN datetime('now') ELSE decided_at END,
      reason = CASE WHEN ? THEN NULL ELSE ? END,
      edit_message = NULL, edit_at = NULL
    WHERE id = ? AND edit_message IS NOT NULL RETURNING *
  `).get(a, a, a, reason, id) as unknown as WishRow | undefined;
}

export function setWishTelegramEditMessage(id: number, messageId: number | null): void {
  getDb().prepare('UPDATE wishes SET tg_edit_message_id = ? WHERE id = ?').run(messageId, id);
}

/** Sets a wish's status (with the reason, when rejecting); returns the updated row, or undefined if there's no such wish. */
export function setWishStatus(id: number, status: WishStatus, reason: string | null = null): WishRow | undefined {
  return getDb().prepare(`
    UPDATE wishes SET status = ?, decided_at = CASE WHEN ? = 'pending' THEN NULL ELSE datetime('now') END,
      reason = CASE WHEN ? = 'rejected' THEN ? ELSE NULL END
    WHERE id = ? RETURNING *
  `).get(status, status, status, reason, id) as WishRow | undefined;
}

/** Sets or changes the reason the guest sees for a rejection. */
export function setWishReason(id: number, reason: string | null): WishRow | undefined {
  return getDb().prepare('UPDATE wishes SET reason = ? WHERE id = ? RETURNING *').get(reason, id) as WishRow | undefined;
}

/** The wish a Telegram post belongs to (its own post or its edit's). */
export function wishByTelegramMessage(messageId: number): WishRow | undefined {
  return getDb().prepare('SELECT * FROM wishes WHERE tg_message_id = ? OR tg_edit_message_id = ?')
    .get(messageId, messageId) as WishRow | undefined;
}

export function setWishTelegramMessage(id: number, messageId: number): void {
  getDb().prepare('UPDATE wishes SET tg_message_id = ? WHERE id = ?').run(messageId, id);
}

export function deleteWish(id: number): WishRow | undefined {
  return getDb().prepare('DELETE FROM wishes WHERE id = ? RETURNING *').get(id) as WishRow | undefined;
}

// ---------- Small key/value store (the Telegram update offset) ----------

export function kvGet(key: string): string | undefined {
  return (getDb().prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined)?.value;
}

export function kvSet(key: string, value: string): void {
  getDb().prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}
