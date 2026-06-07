/**
 * HumanToken Database Layer
 * Uses sql.js (SQLite in pure JS — no native compilation needed)
 */
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data/humantoken.db')

let db = null

export async function initDB() {
  const SQL = await initSqlJs()

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    console.log('📦 Database loaded from', DB_PATH)
  } else {
    db = new SQL.Database()
    console.log('🆕 Database created (new)')
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar TEXT DEFAULT '',
      balance REAL DEFAULT 100,
      total_spent REAL DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      consecutive_days INTEGER DEFAULT 1,
      last_active TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      cost REAL NOT NULL,
      content_type TEXT DEFAULT 'default',
      role TEXT DEFAULT 'default',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      messages INTEGER DEFAULT 0,
      spent REAL DEFAULT 0,
      deep_count INTEGER DEFAULT 0,
      nonsense_count INTEGER DEFAULT 0,
      emotional_count INTEGER DEFAULT 0,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS challenges_completed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date, challenge_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  saveDB()
  console.log('✅ Database tables ready')
  return db
}

export function saveDB() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, buffer)
}

export function getDB() {
  if (!db) throw new Error('DB not initialized — call initDB() first')
  return db
}

export function getUser(id) {
  const stmt = getDB().prepare('SELECT * FROM users WHERE id = ?')
  stmt.bind([id])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

export function getUserByUsername(username) {
  const stmt = getDB().prepare('SELECT * FROM users WHERE username = ?')
  stmt.bind([username])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

export function createUser(username, passwordHash, displayName) {
  const stmt = getDB().prepare(
    'INSERT INTO users (username, password_hash, display_name, balance, last_active) VALUES (?, ?, ?, 100, datetime("now"))'
  )
  stmt.run([username, passwordHash, displayName || username])
  stmt.free()
  const user = getUserByUsername(username)
  saveDB()
  return user
}

export function updateUserBalance(userId, newBalance, cost) {
  const stmt = getDB().prepare(
    'UPDATE users SET balance = ?, total_spent = total_spent + ?, message_count = message_count + 1, last_active = datetime("now") WHERE id = ?'
  )
  stmt.run([newBalance, cost, userId])
  stmt.free()
  saveDB()
}

export function recordMessage(userId, content, cost, contentType, role) {
  const stmt = getDB().prepare(
    'INSERT INTO messages (user_id, content, cost, content_type, role) VALUES (?, ?, ?, ?, ?)'
  )
  stmt.run([userId, content, cost, contentType, role])
  stmt.free()

  // Update daily stats
  const today = new Date().toISOString().split('T')[0]
  const existing = getDB().prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date = ?')
  existing.bind([userId, today])
  if (existing.step()) {
    const ds = existing.getAsObject()
    existing.free()
    const updateStmt = getDB().prepare(
      'UPDATE daily_stats SET messages = messages + 1, spent = spent + ?, deep_count = deep_count + ?, nonsense_count = nonsense_count + ?, emotional_count = emotional_count + ? WHERE user_id = ? AND date = ?'
    )
    updateStmt.run([
      cost,
      contentType === 'deep' ? 1 : 0,
      contentType === 'nonsense' ? 1 : 0,
      contentType === 'emotional' ? 1 : 0,
      userId, today
    ])
    updateStmt.free()
  } else {
    existing.free()
    const insertStmt = getDB().prepare(
      'INSERT INTO daily_stats (user_id, date, messages, spent, deep_count, nonsense_count, emotional_count) VALUES (?, ?, 1, ?, ?, ?, ?)'
    )
    insertStmt.run([
      userId, today, cost,
      contentType === 'deep' ? 1 : 0,
      contentType === 'nonsense' ? 1 : 0,
      contentType === 'emotional' ? 1 : 0
    ])
    insertStmt.free()
  }

  saveDB()
}

export function getLeaderboard(limit = 20) {
  const results = []
  const stmt = getDB().prepare('SELECT id, display_name, username, total_spent, message_count, last_active, consecutive_days FROM users ORDER BY total_spent DESC LIMIT ?')
  stmt.bind([limit])
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function resetDailyBalances() {
  const stmt = getDB().prepare('UPDATE users SET balance = 100, last_active = datetime("now")')
  stmt.run()
  stmt.free()
  saveDB()
}

export function unlockAchievement(userId, achievementId) {
  try {
    const stmt = getDB().prepare(
      'INSERT OR IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)'
    )
    stmt.run([userId, achievementId])
    stmt.free()
    saveDB()
    return true
  } catch {
    return false
  }
}

export function getUserAchievements(userId) {
  const results = []
  const stmt = getDB().prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?')
  stmt.bind([userId])
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function addFriend(userId, friendId) {
  try {
    const stmt = getDB().prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)')
    stmt.run([userId, friendId])
    stmt.free()
    saveDB()
    return true
  } catch {
    return false
  }
}

export function getFriends(userId) {
  const results = []
  const stmt = getDB().prepare(`
    SELECT u.id, u.display_name, u.username, u.total_spent, u.message_count, u.last_active
    FROM friends f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ?
    ORDER BY u.total_spent DESC
  `)
  stmt.bind([userId])
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function getDailyStats(userId) {
  const today = new Date().toISOString().split('T')[0]
  const stmt = getDB().prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date = ?')
  stmt.bind([userId, today])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return { messages: 0, spent: 0, deep_count: 0, nonsense_count: 0, emotional_count: 0 }
}

export function completeChallenge(userId, challengeId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const stmt = getDB().prepare(
      'INSERT OR IGNORE INTO challenges_completed (user_id, date, challenge_id) VALUES (?, ?, ?)'
    )
    stmt.run([userId, today, challengeId])
    stmt.free()
    saveDB()
    return true
  } catch {
    return false
  }
}