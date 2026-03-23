import { useState, useEffect, useCallback } from 'react'
import { detectContentType, RATE_CONFIG, DEFAULT_BALANCE, DAILY_LIMIT, DEFAULT_ROLE_MULTIPLIERS, DEFAULT_ROLE_LABELS, DAILY_CHALLENGES, ACHIEVEMENTS, getSarcasmComment, type ContentType, MOCK_LEADERBOARD, TASKS, SUBSCRIPTIONS } from '@shared/config'

interface Message {
  id: number
  content: string
  cost: number
  timestamp: string
  type: 'sent' | 'received'
  contentType: ContentType
}

interface UserStats {
  balance: number
  totalSpent: number
  messageCount: number
  dailyLimit: number
}

interface CustomRole {
  key: string
  label: string
  multiplier: number
}

const API_BASE = 'http://localhost:3001/api'

const STORAGE_KEY = {
  stats: 'humantoken_stats',
  messages: 'humantoken_messages',
  role: 'humantoken_role',
  customRoles: 'humantoken_custom_roles',
  achievements: 'humantoken_achievements',
  dailyChallenges: 'humantoken_daily_challenges',
  dailyStats: 'humantoken_daily_stats',
  tasks: 'humantoken_tasks',
  subscription: 'humantoken_subscription',
  userName: 'humantoken_username',
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn('Failed to save to localStorage')
  }
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  default: '普通',
  nonsense: '废话',
  deep: '深度',
  emotional: '情感',
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => loadFromStorage(STORAGE_KEY.messages, []))
  const [stats, setStats] = useState<UserStats>(() => loadFromStorage(STORAGE_KEY.stats, {
    balance: DEFAULT_BALANCE,
    totalSpent: 0,
    messageCount: 0,
    dailyLimit: DAILY_LIMIT,
  }))
  const [role, setRole] = useState<string>(() => loadFromStorage(STORAGE_KEY.role, 'default'))
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => loadFromStorage(STORAGE_KEY.customRoles, []))
  const [isDead, setIsDead] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [detectedType, setDetectedType] = useState<ContentType>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleEditor, setShowRoleEditor] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [newRoleMultiplier, setNewRoleMultiplier] = useState('1.0')
  const [showAchievements, setShowAchievements] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [darkMode, setDarkMode] = useState(() => loadFromStorage('humantoken_darkmode', false))
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => loadFromStorage(STORAGE_KEY.tasks, []))
  const [subscription, setSubscription] = useState<string>(() => loadFromStorage(STORAGE_KEY.subscription, 'free'))
  const [userName, setUserName] = useState(() => loadFromStorage(STORAGE_KEY.userName, '匿名用户'))

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY.achievements, [])
  )
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY.dailyChallenges, [])
  )
  const [dailyStats, setDailyStats] = useState(() => loadFromStorage(STORAGE_KEY.dailyStats, {
    date: new Date().toDateString(),
    messages: 0,
    spent: 0,
    deep: 0,
    nonsense: 0,
    emotional: 0,
  }))

  const getAllRoles = useCallback(() => {
    const defaults = Object.entries(DEFAULT_ROLE_MULTIPLIERS).map(([key, multiplier]) => ({
      key,
      label: DEFAULT_ROLE_LABELS[key] || key,
      multiplier,
      isDefault: true,
    }))
    const customs = customRoles.map(r => ({ ...r, isDefault: false }))
    return [...defaults.filter(d => d.key !== 'default'), ...customs]
  }, [customRoles])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.stats, stats)
  }, [stats])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.messages, messages)
  }, [messages])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.role, role)
  }, [role])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.customRoles, customRoles)
  }, [customRoles])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.achievements, unlockedAchievements)
  }, [unlockedAchievements])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.dailyChallenges, completedChallenges)
  }, [completedChallenges])

  useEffect(() => {
    saveToStorage('humantoken_darkmode', darkMode)
  }, [darkMode])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.tasks, completedTasks)
  }, [completedTasks])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.subscription, subscription)
  }, [subscription])

  useEffect(() => {
    saveToStorage(STORAGE_KEY.userName, userName)
  }, [userName])

  useEffect(() => {
    const today = new Date().toDateString()
    if (dailyStats.date !== today) {
      setDailyStats({
        date: today,
        messages: 0,
        spent: 0,
        deep: 0,
        nonsense: 0,
        emotional: 0,
      })
      setCompletedChallenges([])
    }
  }, [dailyStats.date])

  const getMultiplier = useCallback((roleKey: string) => {
    if (roleKey === 'default') return 1
    if (DEFAULT_ROLE_MULTIPLIERS[roleKey] !== undefined) return DEFAULT_ROLE_MULTIPLIERS[roleKey]
    const custom = customRoles.find(r => r.key === roleKey)
    return custom ? custom.multiplier : 1
  }, [customRoles])

  const getRoleLabel = useCallback((roleKey: string) => {
    if (roleKey === 'default') return '普通'
    if (DEFAULT_ROLE_LABELS[roleKey]) return DEFAULT_ROLE_LABELS[roleKey]
    const custom = customRoles.find(r => r.key === roleKey)
    return custom ? custom.label : roleKey
  }, [customRoles])

  const checkAchievements = useCallback((contentType: ContentType, cost: number) => {
    const newUnlocked: string[] = []
    const totalMessages = stats.messageCount + 1
    const totalSpent = stats.totalSpent + cost
    const dailySpent = dailyStats.spent + cost
    const deepMessages = contentType === 'deep' ? dailyStats.deep + 1 : dailyStats.deep
    const nonsenseMessages = contentType === 'nonsense' ? dailyStats.nonsense + 1 : dailyStats.nonsense
    const emotionalMessages = contentType === 'emotional' ? dailyStats.emotional + 1 : dailyStats.emotional

    ACHIEVEMENTS.forEach(achievement => {
      if (unlockedAchievements.includes(achievement.id)) return

      const conditionMet = achievement.condition({
        totalMessages,
        deepMessages,
        nonsenseMessages,
        emotionalMessages,
        minCostMessage: cost,
        dailySpent,
        usingBossRole: role === 'boss',
        consecutiveDays: 1,
        totalSpent,
      })

      if (conditionMet) {
        newUnlocked.push(achievement.id)
      }
    })

    if (newUnlocked.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newUnlocked])
      setTimeout(() => {
        alert(`🏆 成就解锁: ${newUnlocked.map(id => ACHIEVEMENTS.find(a => a.id === id)?.name).join(', ')}`)
      }, 1000)
    }
  }, [stats, dailyStats, role, unlockedAchievements])

  const checkChallenges = useCallback((contentType: ContentType, cost: number) => {
    const newCompleted: string[] = []
    const newRewards: number[] = []

    DAILY_CHALLENGES.forEach(challenge => {
      if (completedChallenges.includes(challenge.id)) return

      let progress = 0
      switch (challenge.type) {
        case 'messages':
          progress = dailyStats.messages + 1
          break
        case 'deep':
          progress = contentType === 'deep' ? dailyStats.deep + 1 : dailyStats.deep
          break
        case 'nonsense':
          progress = contentType === 'nonsense' ? dailyStats.nonsense + 1 : dailyStats.nonsense
          break
        case 'emotional':
          progress = contentType === 'emotional' ? dailyStats.emotional + 1 : dailyStats.emotional
          break
        case 'spend':
          progress = dailyStats.spent + cost
          break
      }

      if (progress >= challenge.target) {
        newCompleted.push(challenge.id)
        newRewards.push(challenge.reward)
      }
    })

    if (newCompleted.length > 0) {
      const totalReward = newRewards.reduce((a, b) => a + b, 0)
      setCompletedChallenges(prev => [...prev, ...newCompleted])
      setStats(prev => ({ ...prev, balance: prev.balance + totalReward }))
      setTimeout(() => {
        alert(`🎯 挑战完成! 获得 ¥${totalReward} 奖励!`)
      }, 1000)
    }
  }, [dailyStats, completedChallenges])

  const estimateCost = useCallback(async (text: string) => {
    if (!text.trim()) {
      setEstimatedCost(0)
      setDetectedType('default')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role, customRoles }),
      })
      const data = await response.json()
      setEstimatedCost(data.cost)
      setDetectedType(data.contentType)
    } catch {
      const type = detectContentType(text)
      const baseCost = text.length * (RATE_CONFIG[type] || RATE_CONFIG.default)
      const multiplier = getMultiplier(role)
      setEstimatedCost(baseCost * multiplier)
      setDetectedType(type)
    }
  }, [role, getMultiplier])

  useEffect(() => {
    const timer = setTimeout(() => estimateCost(input), 300)
    return () => clearTimeout(timer)
  }, [input, role, estimateCost])

  const sendMessage = async () => {
    if (!input.trim() || isDead || isLoading) return
    
    setIsLoading(true)
    const text = input
    const multiplier = getMultiplier(role)

    try {
      const response = await fetch(`${API_BASE}/deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role, currentBalance: stats.balance, customRoles }),
      })
      const data = await response.json()

      if (!data.success) {
        setIsDead(true)
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: '⚠️ 余额不足，已断网！',
          cost: 0,
          timestamp: new Date().toISOString(),
          type: 'received',
          contentType: 'default'
        }])
        setInput('')
        setIsLoading(false)
        return
      }

      setStats(prev => ({
        ...prev,
        balance: data.newBalance,
        totalSpent: prev.totalSpent + data.cost,
        messageCount: prev.messageCount + 1
      }))

      const contentType = detectContentType(text)
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: text,
        cost: data.cost,
        timestamp: new Date().toISOString(),
        type: 'sent',
        contentType
      }])

      setDailyStats(prev => ({
        ...prev,
        messages: prev.messages + 1,
        spent: prev.spent + data.cost,
        deep: contentType === 'deep' ? prev.deep + 1 : prev.deep,
        nonsense: contentType === 'nonsense' ? prev.nonsense + 1 : prev.nonsense,
        emotional: contentType === 'emotional' ? prev.emotional + 1 : prev.emotional,
      }))

      checkAchievements(contentType, data.cost)
      checkChallenges(contentType, data.cost)

      const sarcasmComment = getSarcasmComment(contentType)
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          content: sarcasmComment,
          cost: 0,
          timestamp: new Date().toISOString(),
          type: 'received',
          contentType: 'default'
        }])
      }, 500)

    } catch (error) {
      console.error('API Error:', error)
      const type = detectContentType(text)
      const baseCost = text.length * (RATE_CONFIG[type] || RATE_CONFIG.default)
      const cost = baseCost * multiplier

      if (cost > stats.balance) {
        setIsDead(true)
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: '⚠️ 余额不足，已断网！',
          cost: 0,
          timestamp: new Date().toISOString(),
          type: 'received',
          contentType: 'default'
        }])
        setInput('')
        setIsLoading(false)
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
        content: text,
        cost,
        timestamp: new Date().toISOString(),
        type: 'sent',
        contentType: type
      }])

      setDailyStats(prev => ({
        ...prev,
        messages: prev.messages + 1,
        spent: prev.spent + cost,
        deep: type === 'deep' ? prev.deep + 1 : prev.deep,
        nonsense: type === 'nonsense' ? prev.nonsense + 1 : prev.nonsense,
        emotional: type === 'emotional' ? prev.emotional + 1 : prev.emotional,
      }))

      checkAchievements(type, cost)
      checkChallenges(type, cost)

      const sarcasmComment = getSarcasmComment(type)

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          content: sarcasmComment + ' (离线模式)',
          cost: 0,
          timestamp: new Date().toISOString(),
          type: 'received',
          contentType: 'default'
        }])
      }, 500)
    }

    setInput('')
    setIsLoading(false)
  }

  const resetDay = () => {
    setStats(prev => ({ ...prev, balance: prev.dailyLimit }))
    setIsDead(false)
    setMessages([])
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const addOrUpdateRole = () => {
    if (!newRoleLabel.trim() || !newRoleMultiplier) return

    const multiplier = parseFloat(newRoleMultiplier)
    if (isNaN(multiplier) || multiplier < 0) return

    if (editingRole) {
      setCustomRoles(prev => prev.map(r => 
        r.key === editingRole.key 
          ? { ...r, label: newRoleLabel.trim(), multiplier }
          : r
      ))
    } else {
      const key = 'custom_' + Date.now()
      setCustomRoles(prev => [...prev, { key, label: newRoleLabel.trim(), multiplier }])
    }

    setNewRoleLabel('')
    setNewRoleMultiplier('1.0')
    setEditingRole(null)
  }

  const deleteRole = (key: string) => {
    if (role === key) setRole('default')
    setCustomRoles(prev => prev.filter(r => r.key !== key))
  }

  const startEditRole = (customRole: CustomRole) => {
    setEditingRole(customRole)
    setNewRoleLabel(customRole.label)
    setNewRoleMultiplier(customRole.multiplier.toString())
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? isDead 
          ? 'bg-gray-950' 
          : 'dark bg-gray-900'
        : isDead 
          ? 'bg-gradient-to-br from-red-900 via-gray-900 to-black'
          : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-black'
    } text-white p-4 sm:p-6`}>
      <div className="max-w-2xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              🌐 HumanToken
            </h1>
            <p className="text-gray-400 text-sm">
              {isDead ? '😵 您已断网，请充值后说话' : '说话即付钱，AI经济学的人类版本'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="昵称"
              className="px-2 py-1 rounded text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 w-24"
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all text-sm"
            >
              {darkMode ? '☀️ 亮色' : '🌙 暗黑'}
            </button>
          </div>
        </header>

        <div className={`rounded-xl p-4 mb-6 backdrop-blur ${
          darkMode ? 'bg-gray-800/30' : 'bg-gray-800/50'
        } ${isDead ? 'border-2 border-red-500/50' : ''}`}>
          {isDead && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-center">
              <p className="text-red-400 font-medium mb-2">💸 余额已耗尽</p>
              <p className="text-gray-400 text-sm">您已发送 {stats.messageCount} 条消息，累计消费 ¥{stats.totalSpent.toFixed(2)}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-xs">当前余额</p>
              <p className={`text-3xl font-bold ${isDead ? 'text-red-500' : stats.balance < 20 ? 'text-red-500' : 'text-green-400'}`}>
                ¥{stats.balance.toFixed(2)}
              </p>
            </div>
            <div className={`text-left sm:text-right ${isDead ? 'opacity-50' : ''}`}>
              <p className="text-gray-400 text-xs">今日消费</p>
              <p className="text-xl text-pink-400">¥{stats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-700'}`}>
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                isDead ? 'bg-red-600' : stats.balance < 20 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-pink-500 to-purple-500'
              }`}
              style={{ width: `${Math.max(0, (stats.balance / stats.dailyLimit) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            已发送 {stats.messageCount} 条消息 | 角色: {getRoleLabel(role)} ({getMultiplier(role)}x)
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="flex-1 bg-yellow-600/50 hover:bg-yellow-600/70 rounded-xl p-3 flex items-center justify-center gap-2 transition-all"
          >
            <span>🏆</span>
            <span className="text-sm">成就 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span>
          </button>
          <button
            onClick={() => setShowChallenges(!showChallenges)}
            className="flex-1 bg-green-600/50 hover:bg-green-600/70 rounded-xl p-3 flex items-center justify-center gap-2 transition-all"
          >
            <span>🎯</span>
            <span className="text-sm">挑战 ({completedChallenges.length}/{DAILY_CHALLENGES.length})</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex-1 bg-blue-600/50 hover:bg-blue-600/70 rounded-xl p-3 flex items-center justify-center gap-2 transition-all"
          >
            <span>🏅</span>
            <span className="text-sm">排行榜</span>
          </button>
          <button
            onClick={() => setShowTasks(!showTasks)}
            className="flex-1 bg-purple-600/50 hover:bg-purple-600/70 rounded-xl p-3 flex items-center justify-center gap-2 transition-all"
          >
            <span>📋</span>
            <span className="text-sm">任务</span>
          </button>
          <button
            onClick={() => setShowSubscription(!showSubscription)}
            className="flex-1 bg-red-600/50 hover:bg-red-600/70 rounded-xl p-3 flex items-center justify-center gap-2 transition-all"
          >
            <span>💎</span>
            <span className="text-sm">会员</span>
          </button>
        </div>

        {showLeaderboard && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🏆 成就系统
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map(achievement => {
                const isUnlocked = unlockedAchievements.includes(achievement.id)
                return (
                  <div 
                    key={achievement.id}
                    className={`p-2 rounded-lg text-xs ${
                      isUnlocked 
                        ? 'bg-yellow-600/30 border border-yellow-500' 
                        : 'bg-gray-700/30 border border-gray-600 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{isUnlocked ? achievement.icon : '🔒'}</span>
                      <span className={isUnlocked ? 'text-yellow-400' : 'text-gray-400'}>{achievement.name}</span>
                    </div>
                    <p className="text-gray-500">{achievement.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showChallenges && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🎯 今日挑战
            </h3>
            <div className="space-y-2">
              {DAILY_CHALLENGES.map(challenge => {
                const isCompleted = completedChallenges.includes(challenge.id)
                let progress = 0
                switch (challenge.type) {
                  case 'messages': progress = dailyStats.messages; break
                  case 'deep': progress = dailyStats.deep; break
                  case 'nonsense': progress = dailyStats.nonsense; break
                  case 'emotional': progress = dailyStats.emotional; break
                  case 'spend': progress = dailyStats.spent; break
                }
                const percent = Math.min(100, (progress / challenge.target) * 100)
                
                return (
                  <div 
                    key={challenge.id}
                    className={`p-3 rounded-lg ${
                      isCompleted 
                        ? 'bg-green-600/30 border border-green-500' 
                        : 'bg-gray-700/30 border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{isCompleted ? '✅' : challenge.icon}</span>
                        <span className="font-medium">{challenge.name}</span>
                      </div>
                      <span className="text-sm text-yellow-400">+¥{challenge.reward}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{challenge.description}</p>
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {progress} / {challenge.target}
                      {isCompleted && ' (已完成!)'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🏅 排行榜
            </h3>
            <div className="space-y-2">
              {MOCK_LEADERBOARD.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${
                      index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-gray-500">{entry.totalMessages} 条消息 | {entry.lastActive}</p>
                    </div>
                  </div>
                  <p className="text-yellow-400 font-bold">¥{entry.totalSpent.toFixed(1)}</p>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg bg-purple-600/30 border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{userName} (你)</p>
                    <p className="text-xs text-gray-400">{stats.totalSpent.toFixed(1)} 元 | {stats.messageCount} 条消息</p>
                  </div>
                  <p className="text-purple-400 font-bold">#?</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTasks && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              📋 任务中心
            </h3>
            <div className="space-y-2">
              {TASKS.map(task => {
                const isCompleted = completedTasks.includes(task.id)
                return (
                  <div key={task.id} className={`p-3 rounded-lg ${isCompleted ? 'bg-green-600/30 border border-green-500' : 'bg-gray-700/30 border border-gray-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{task.icon}</span>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-xs text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <span className="text-green-400">✅</span>
                      ) : (
                        <button
                          onClick={() => {
                            setCompletedTasks(prev => [...prev, task.id])
                            setStats(prev => ({ ...prev, balance: prev.balance + task.reward }))
                            alert(`🎉 任务完成! 获得 ¥${task.reward}`)
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm"
                        >
                          领取
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-yellow-400 mt-2">+¥{task.reward}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showSubscription && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              💎 会员中心
            </h3>
            <div className="grid gap-3">
              {SUBSCRIPTIONS.map(sub => (
                <div key={sub.tier} className={`p-4 rounded-lg ${subscription === sub.tier ? 'bg-purple-600/50 border-2 border-purple-500' : 'bg-gray-700/30 border border-gray-600'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{sub.name}</span>
                      {subscription === sub.tier && <span className="text-xs bg-purple-500 px-2 py-0.5 rounded">当前</span>}
                    </div>
                    <p className="text-yellow-400 font-bold">¥{sub.price}/月</p>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {sub.features.map((f, i) => (
                      <li key={i}>✓ {f}</li>
                    ))}
                  </ul>
                  {subscription !== sub.tier && (
                    <button
                      onClick={() => {
                        setSubscription(sub.tier)
                        if (sub.tier === 'pro') setStats(prev => ({ ...prev, dailyLimit: 500 }))
                        if (sub.tier === 'vip') setStats(prev => ({ ...prev, dailyLimit: 99999 }))
                        alert(`🎉 已成为 ${sub.name}!`)
                      }}
                      className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium"
                    >
                      开通
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-xl p-4 mb-6 backdrop-blur ${darkMode ? 'bg-gray-800/30' : 'bg-gray-800/50'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <p className="text-sm text-gray-400">选择你的角色（影响费率）</p>
            <button
              onClick={() => setShowRoleEditor(!showRoleEditor)}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              {showRoleEditor ? '收起' : '+ 自定义角色'}
            </button>
          </div>

          {showRoleEditor && (
            <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-700/50'}`}>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  placeholder="角色名称"
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${
                    darkMode ? 'bg-gray-900 border border-gray-600 text-white' : 'bg-gray-800 border border-gray-600 text-white'
                  }`}
                />
                <input
                  type="number"
                  value={newRoleMultiplier}
                  onChange={(e) => setNewRoleMultiplier(e.target.value)}
                  placeholder="倍率"
                  step="0.1"
                  min="0"
                  className={`w-20 px-3 py-1.5 rounded text-sm ${
                    darkMode ? 'bg-gray-900 border border-gray-600 text-white' : 'bg-gray-800 border border-gray-600 text-white'
                  }`}
                />
                <button
                  onClick={addOrUpdateRole}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm"
                >
                  {editingRole ? '保存' : '添加'}
                </button>
              </div>
              {editingRole && (
                <button
                  onClick={() => { setEditingRole(null); setNewRoleLabel(''); setNewRoleMultiplier('1.0'); }}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  取消编辑
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {getAllRoles().map(r => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1 ${
                  role === r.key 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <span>{r.label}</span>
                <span className="text-xs opacity-60">({r.multiplier}x)</span>
                {!r.isDefault && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditRole(r); }}
                      className="ml-1 text-xs hover:text-white"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRole(r.key); }}
                      className="text-xs hover:text-red-400"
                    >
                      ×
                    </button>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-6 max-h-80 sm:max-h-96 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-xl ${
                msg.type === 'sent' 
                  ? darkMode ? 'bg-purple-700' : 'bg-purple-600 text-white' 
                  : darkMode ? 'bg-gray-700' : 'bg-gray-700 text-gray-200'
              }`}>
                <p className="break-words">{msg.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  {msg.cost > 0 && (
                    <p className="text-xs text-purple-300">💸 ¥{msg.cost.toFixed(4)}</p>
                  )}
                  <p className="text-xs text-gray-500">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-gray-500">输入你想说的话，开始扣费...</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            placeholder={isDead ? '余额不足，无法发言 😵' : '输入你想说的话...'}
            disabled={isDead}
            className={`flex-1 p-3 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 border-gray-700'
            } ${isDead ? 'opacity-50' : ''}`}
          />
          <button
            onClick={sendMessage}
            disabled={isDead || !input.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isDead || !input.trim() || isLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
            }`}
          >
            {isLoading ? '发送中...' : '发送 💰'}
          </button>
        </div>

        {input && !isDead && (
          <div className="mt-2 text-center text-sm text-gray-400">
            预估费用: ¥{estimatedCost.toFixed(4)} | 
            内容类型: {CONTENT_TYPE_LABELS[detectedType] || detectedType}
          </div>
        )}

        <div className="mt-6 sm:mt-8 text-center space-y-2">
          <button
            onClick={resetDay}
            className="text-sm text-gray-500 hover:text-gray-400 underline block w-full"
          >
            新的一天 (重置余额)
          </button>
        </div>

        <footer className="mt-8 text-center text-gray-500 dark:text-gray-600 text-xs">
          <p>⚡ 受黄仁勋 GTC 2026 Token经济学启发</p>
          <p className="mt-1">GitHub: github.com/human-token/human-token</p>
        </footer>
      </div>
    </div>
  )
}

export default App
