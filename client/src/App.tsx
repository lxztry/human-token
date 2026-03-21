import { useState, useEffect } from 'react'

interface Message {
  id: number
  content: string
  cost: number
  timestamp: Date
  type: 'sent' | 'received'
}

interface UserStats {
  balance: number
  totalSpent: number
  messageCount: number
  dailyLimit: number
}

const ROLE_MULTIPLIERS: Record<string, number> = {
  default: 1.0,
  programmer: 1.5,
  sales: 1.3,
  pm: 2.0,
  boss: 0,
}

const CONTENT_MULTIPLIERS: Record<string, number> = {
  default: 0.01,
  nonsense: 0.001,
  deep: 0.1,
  emotional: 0.5,
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<UserStats>({
    balance: 100,
    totalSpent: 0,
    messageCount: 0,
    dailyLimit: 100,
  })
  const [role, setRole] = useState('default')
  const [isDead, setIsDead] = useState(false)

  const estimateCost = (text: string): number => {
    const baseCost = text.length * CONTENT_MULTIPLIERS.default
    const multiplier = ROLE_MULTIPLIERS[role] || 1
    return baseCost * multiplier
  }

  const detectContentType = (text: string): string => {
    const nonsensePatterns = [/啊/i, /嗯/i, /这个/i, /那个/i, /然后/i]
    const deepPatterns = [/为什么/i, /如何/i, /怎么/i, /思考/i]
    const emotionalPatterns = [/安慰/i, /鼓励/i, /难过/i, /加油/i]
    
    if (nonsensePatterns.some(p => p.test(text))) return 'nonsense'
    if (deepPatterns.some(p => p.test(text))) return 'deep'
    if (emotionalPatterns.some(p => p.test(text))) return 'emotional'
    return 'default'
  }

  const sendMessage = () => {
    if (!input.trim() || isDead) return
    
    const contentType = detectContentType(input)
    const baseCost = input.length * (CONTENT_MULTIPLIERS[contentType] || 0.01)
    const multiplier = ROLE_MULTIPLIERS[role] || 1
    const cost = baseCost * multiplier

    if (cost > stats.balance) {
      setIsDead(true)
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: '⚠️ 余额不足，已断网！',
        cost: 0,
        timestamp: new Date(),
        type: 'received'
      }])
      return
    }

    setStats(prev => ({
      ...prev,
      balance: prev.balance - cost,
      totalSpent: prev.totalSpent + cost,
      messageCount: prev.messageCount + 1
    }))

    setMessages(prev => [...prev, {
      id: Date.now(),
      content: input,
      cost,
      timestamp: new Date(),
      type: 'sent'
    }])

    const responses = [
      "收到，已扣除 Token 💸",
      "话语已发出，费用已扣除 📝",
      "温馨提示：您当前余额即将耗尽 ⚠️",
      "这条消息花费 " + cost.toFixed(4) + " 元",
    ]
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: responses[Math.floor(Math.random() * responses.length)],
        cost: 0,
        timestamp: new Date(),
        type: 'received'
      }])
    }, 500)

    setInput('')
  }

  const resetDay = () => {
    setStats(prev => ({ ...prev, balance: prev.dailyLimit }))
    setIsDead(false)
    setMessages([])
  }

  return (
    <div className={`min-h-screen ${isDead ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-black'} text-white p-4`}>
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            🌐 HumanToken
          </h1>
          <p className="text-gray-400 text-sm">
            {isDead ? '😵 您已断网，请充值后说话' : '说话即付钱，AI经济学的人类版本'}
          </p>
        </header>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-400 text-xs">当前余额</p>
              <p className={`text-3xl font-bold ${stats.balance < 20 ? 'text-red-500' : 'text-green-400'}`}>
                ¥{stats.balance.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">今日消费</p>
              <p className="text-xl text-pink-400">¥{stats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${stats.balance < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
              style={{ width: `${(stats.balance / stats.dailyLimit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            已发送 {stats.messageCount} 条消息 | 角色: {role}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
          <p className="text-sm text-gray-400 mb-3">选择你的角色（影响费率）</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ROLE_MULTIPLIERS).filter(([k]) => k !== 'default').map(([key, mult]) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  role === key 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {key === 'programmer' && '👨‍💻 程序员'}
                {key === 'sales' && '💼 销售'}
                {key === 'pm' && '📋 产品经理'}
                {key === 'boss' && '👔 老板 (免费)'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${
                msg.type === 'sent' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-200'
              }`}>
                <p>{msg.content}</p>
                {msg.cost > 0 && (
                  <p className="text-xs text-purple-300 mt-1">💸 ¥{msg.cost.toFixed(4)}</p>
                )}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-gray-500">输入你想说的话，开始扣费...</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isDead ? '余额不足，无法发言 😵' : '输入你想说的话...'}
            disabled={isDead}
            className={`flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 ${isDead ? 'opacity-50' : ''}`}
          />
          <button
            onClick={sendMessage}
            disabled={isDead || !input.trim()}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isDead || !input.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
            }`}
          >
            发送 💰
          </button>
        </div>

        {input && !isDead && (
          <div className="mt-2 text-center text-sm text-gray-400">
            预估费用: ¥{estimateCost(input).toFixed(4)} | 
            内容类型: {detectContentType(input)}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={resetDay}
            className="text-sm text-gray-500 hover:text-gray-400 underline"
          >
            新的一天 (重置余额)
          </button>
        </div>

        <footer className="mt-8 text-center text-gray-600 text-xs">
          <p>⚡ 受黄仁勋 GTC 2026 Token经济学启发</p>
          <p className="mt-1">GitHub: github.com/human-token/human-token</p>
        </footer>
      </div>
    </div>
  )
}

export default App