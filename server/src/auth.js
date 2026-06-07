/**
 * HumanToken Auth Utilities
 * Password hashing + JWT
 */
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'human-token-secret-v2-2026'
const JWT_EXPIRES = '7d'

// Simple password hash (use bcrypt in production)
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'humantoken-salt-2026').digest('hex')
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }

  req.user = decoded
  next()
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) req.user = decoded
  }
  next()
}