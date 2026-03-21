import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const RATE_CONFIG = {
  default: 0.01,
  nonsense: 0.001,
  deep: 0.1,
  emotional: 0.5,
  boss: 0,
}

const ROLE_MULTIPLIERS = {
  default: 1.0,
  programmer: 1.5,
  sales: 1.3,
  pm: 2.0,
  boss: 0,
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HumanToken API is running' })
})

app.post('/api/calculate', (req, res) => {
  const { text, role = 'default' } = req.body
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const contentType = detectContentType(text)
  const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
  const multiplier = ROLE_MULTIPLIERS[role] || 1
  const cost = text.length * baseRate * multiplier

  res.json({
    text,
    cost: cost.toFixed(4),
    contentType,
    role,
    characterCount: text.length
  })
})

app.post('/api/deduct', (req, res) => {
  const { text, role = 'default', currentBalance } = req.body
  
  const contentType = detectContentType(text)
  const baseRate = RATE_CONFIG[contentType] || RATE_CONFIG.default
  const multiplier = ROLE_MULTIPLIERS[role] || 1
  const cost = text.length * baseRate * multiplier

  const newBalance = currentBalance - cost

  res.json({
    cost: cost.toFixed(4),
    newBalance: newBalance.toFixed(2),
    success: newBalance >= 0
  })
})

function detectContentType(text) {
  const nonsensePatterns = [/啊/i, /嗯/i, /这个/i, /那个/i, /然后/i]
  const deepPatterns = [/为什么/i, /如何/i, /怎么/i, /思考/i]
  const emotionalPatterns = [/安慰/i, /鼓励/i, /难过/i, /加油/i]
  
  if (nonsensePatterns.some(p => p.test(text))) return 'nonsense'
  if (deepPatterns.some(p => p.test(text))) return 'deep'
  if (emotionalPatterns.some(p => p.test(text))) return 'emotional'
  return 'default'
}

app.listen(PORT, () => {
  console.log(`🌐 HumanToken API running on http://localhost:${PORT}`)
})