/**
 * HumanToken Server v2
 * Express + sql.js + JWT
 */
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { detectContentType, RATE_CONFIG, DEFAULT_ROLE_MULTIPLIERS } from '../../shared/config.js'
import { authMiddleware, optionalAuth, hashPassword, verifyPassword, signToken } from './auth.js'
import {
  initDB,
  getDB,
  getUser,
  getUserByUsername,
  createUser,
  updateUserBalance,
  recordMessage,
  getLeaderboard,
  resetDailyBalances,
  unlockAchievement,
  getUserAchievements,
  getFriends,
  addFriend,
  getDailyStats,
  completeChallenge,
  saveDB
} from './db.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' }
})
app.use('/api', apiLimiter)

// ─── Health ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0', message: 'HumanToken API v2' })
})

// ─── Auth ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = getUserByUsername(username)
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const passwordHash = hashPassword(password)
    const user = createUser(username, passwordHash, displayName || username)
    const token = signToken({ userId: user.id, username: user.username })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        balance: user.balance
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const user = getUserByUsername(username)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ userId: user.id, username: user.username })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        balance: user.balance,
        totalSpent: user.total_spent,
        messageCount: user.message_count,
        consecutiveDays: user.consecutive_days
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUser(req.user.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    balance: user.balance,
    totalSpent: user.total_spent,
    messageCount: user.message_count,
    consecutiveDays: user.consecutive_days,
    achievements: getUserAchievements(user.id)
  })
})

// ─── User Profile ──────────────────────────────────────
app.get('/api/users/:id', optionalAuth, (req, res) => {
  const user = getUser(parseInt(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatar: user.avatar,
    totalSpent: user.total_spent,
    messageCount: user.message_count,
    consecutiveDays: user.consecutive_days,
    lastActive: user.last_active,
    createdAt: user.created_at
  })
})

app.patch('/api/users/me', authMiddleware, (req, res) => {
  try {
    const { displayName, avatar } = req.body
    const db = getDB()

    const updates = []
    const values = []
    if (displayName !== undefined) { updates.push('display_name = ?'); values.push(displayName) }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar) }
    updates.push('updated_at = datetime("now")')
    values.push(req.user.userId)

    if (updates.length > 1) {
      const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      stmt.run(values)
      stmt.free()
      saveDB()
    }

    const user = getUser(req.user.userId)
    res.json({ id: user.id, displayName: user.display_name, avatar: user.avatar })
  } catch (err) {
    res.status(500).json({ error: 'Update failed' })
  }
})

// ─── Calculate & Deduct ────────────────────────────────
const DEFAULT_ROLES = Object.entries(DEFAULT_ROLE_MULTIPLIERS).reduce((acc, [key, value]) => {
  acc[key] = value
  return acc
}, {})

app.post('/api/calculate', authMiddleware, (req, res) => {
  const { text, role = 'default' } = req.body

  if (!text) return res.status(400).json({ error: 'Text is required' })

  const contentType = detectContentType(text)
  const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
  const multiplier = DEFAULT_ROLES[role] !== undefined ? DEFAULT_ROLES[role] : 1
  const cost = text.length * baseRate * multiplier

  res.json({
    text,
    cost: Number(cost.toFixed(4)),
    contentType,
    role,
    characterCount: text.length
  })
})

app.post('/api/deduct', authMiddleware, (req, res) => {
  try {
    const { text, role = 'default', currentBalance } = req.body

    if (!text) return res.status(400).json({ error: 'Text is required' })

    const contentType = detectContentType(text)
    const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
    const multiplier = DEFAULT_ROLES[role] !== undefined ? DEFAULT_ROLES[role] : 1
    const cost = text.length * baseRate * multiplier
    const newBalance = currentBalance - cost

    if (newBalance < 0) {
      return res.json({ cost: 0, newBalance: currentBalance, success: false })
    }

    // Record to DB
    recordMessage(req.user.userId, text, cost, contentType, role)
    updateUserBalance(req.user.userId, newBalance, cost)

    res.json({
      cost: Number(cost.toFixed(4)),
      newBalance: Number(newBalance.toFixed(2)),
      success: true
    })
  } catch (err) {
    res.status(500).json({ error: 'Deduct failed' })
  }
})

// ─── Balance ──────────────────────────────────────────
app.post('/api/balance/reset', authMiddleware, (req, res) => {
  const user = getUser(req.user.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Update balance to 100
  const db = getDB()
  const stmt = db.prepare('UPDATE users SET balance = 100, last_active = datetime("now") WHERE id = ?')
  stmt.run([req.user.userId])
  stmt.free()
  saveDB()

  res.json({ balance: 100 })
})

app.get('/api/balance', authMiddleware, (req, res) => {
  const user = getUser(req.user.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ balance: user.balance, dailyLimit: 100 })
})

// ─── Daily Stats ───────────────────────────────────────
app.get('/api/stats/daily', authMiddleware, (req, res) => {
  const stats = getDailyStats(req.user.userId)
  res.json(stats)
})

app.get('/api/stats/user/:id', authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id)
  const stats = getDailyStats(userId)
  res.json(stats)
})

// ─── Achievements ──────────────────────────────────────
app.get('/api/achievements', authMiddleware, (req, res) => {
  const achievements = getUserAchievements(req.user.userId)
  res.json(achievements.map(a => ({ id: a.achievement_id, unlockedAt: a.unlocked_at })))
})

app.post('/api/achievements/:id/unlock', authMiddleware, (req, res) => {
  const { id } = req.params
  const success = unlockAchievement(req.user.userId, id)
  res.json({ success })
})

// ─── Leaderboard ───────────────────────────────────────
app.get('/api/leaderboard', optionalAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 20
  const board = getLeaderboard(limit)

  const enriched = board.map((entry, index) => ({
    rank: index + 1,
    id: entry.id,
    displayName: entry.display_name,
    username: entry.username,
    totalSpent: entry.total_spent,
    messageCount: entry.message_count,
    lastActive: entry.last_active,
    consecutiveDays: entry.consecutive_days
  }))

  res.json(enriched)
})

app.get('/api/leaderboard/me', authMiddleware, (req, res) => {
  const board = getLeaderboard(100)
  const userRank = board.findIndex(e => e.id === req.user.userId) + 1
  const user = getUser(req.user.userId)
  res.json({
    rank: userRank > 0 ? userRank : '-',
    totalSpent: user.total_spent,
    messageCount: user.message_count
  })
})

// ─── Friends ──────────────────────────────────────────
app.get('/api/friends', authMiddleware, (req, res) => {
  const friends = getFriends(req.user.userId)
  res.json(friends.map(f => ({
    id: f.id,
    displayName: f.display_name,
    username: f.username,
    totalSpent: f.total_spent,
    messageCount: f.message_count,
    lastActive: f.last_active
  })))
})

app.post('/api/friends', authMiddleware, (req, res) => {
  const { friendId } = req.body
  if (!friendId) return res.status(400).json({ error: 'friendId required' })
  if (friendId === req.user.userId) return res.status(400).json({ error: 'Cannot add yourself' })

  const success = addFriend(req.user.userId, friendId)
  res.json({ success })
})

// ─── Challenges ────────────────────────────────────────
app.post('/api/challenges/:id/complete', authMiddleware, (req, res) => {
  const { id } = req.params
  const success = completeChallenge(req.user.userId, id)
  res.json({ success })
})

// ─── Admin ─────────────────────────────────────────────
app.post('/api/admin/reset-all-balances', authMiddleware, (req, res) => {
  // In production, add admin role check
  resetDailyBalances()
  res.json({ success: true, message: 'All balances reset to 100' })
})

// ─── Start ─────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    await initDB()
    console.log(`🌐 HumanToken API v2 running on http://localhost:${PORT}`)
  } catch (err) {
    console.error('Failed to init DB:', err)
    process.exit(1)
  }
})