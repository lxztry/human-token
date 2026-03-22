import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { detectContentType, RATE_CONFIG, DEFAULT_ROLE_MULTIPLIERS } from '../../shared/config.js'

const app = express()
const PORT = 3001
const JWT_SECRET = process.env.JWT_SECRET || 'human-token-secret-key'

app.use(cors())
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
})

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

app.use('/api', apiLimiter)

const DEFAULT_ROLES = Object.entries(DEFAULT_ROLE_MULTIPLIERS).reduce((acc, [key, value]) => {
  acc[key] = value
  return acc
}, {})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HumanToken API is running' })
})

app.post('/api/calculate', authenticateToken, (req, res) => {
  const { text, role = 'default', customRoles = [] } = req.body
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const contentType = detectContentType(text)
  const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
  
  let multiplier = DEFAULT_ROLES[role]
  if (multiplier === undefined) {
    const custom = customRoles.find((r) => r.key === role)
    multiplier = custom ? custom.multiplier : 1
  }
  
  const cost = text.length * baseRate * multiplier

  res.json({
    text,
    cost: Number(cost.toFixed(4)),
    contentType,
    role,
    characterCount: text.length
  })
})

app.post('/api/deduct', authenticateToken, (req, res) => {
  const { text, role = 'default', currentBalance, customRoles = [] } = req.body
  
  const contentType = detectContentType(text)
  const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
  
  let multiplier = DEFAULT_ROLES[role]
  if (multiplier === undefined) {
    const custom = customRoles.find((r) => r.key === role)
    multiplier = custom ? custom.multiplier : 1
  }
  
  const cost = text.length * baseRate * multiplier
  const newBalance = currentBalance - cost

  res.json({
    cost: Number(cost.toFixed(4)),
    newBalance: Number(newBalance.toFixed(2)),
    success: newBalance >= 0
  })
})

app.listen(PORT, () => {
  console.log(`🌐 HumanToken API running on http://localhost:${PORT}`)
})
