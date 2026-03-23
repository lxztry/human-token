export const RATE_CONFIG: Record<string, number> = {
  default: 0.01,
  nonsense: 0.001,
  deep: 0.1,
  emotional: 0.5,
  boss: 0,
}

export const DEFAULT_ROLE_MULTIPLIERS: Record<string, number> = {
  default: 1.0,
  programmer: 1.5,
  sales: 1.3,
  pm: 2.0,
  boss: 0,
}

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  default: '普通',
  programmer: '👨‍💻 程序员',
  sales: '💼 销售',
  pm: '📋 产品经理',
  boss: '👔 老板',
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: AchievementStats) => boolean
  unlockedAt?: string
}

export interface AchievementStats {
  totalMessages: number
  deepMessages: number
  nonsenseMessages: number
  emotionalMessages: number
  minCostMessage: number
  dailySpent: number
  usingBossRole: boolean
  consecutiveDays: number
  totalSpent: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'newbie',
    name: '新手发言',
    description: '发送你的第一条消息',
    icon: '👋',
    condition: (s) => s.totalMessages >= 1,
  },
  {
    id: 'chatty',
    name: '话痨',
    description: '累计发送 100 条消息',
    icon: '💬',
    condition: (s) => s.totalMessages >= 100,
  },
  {
    id: 'super_chatty',
    name: '超级话痨',
    description: '累计发送 500 条消息',
    icon: '🎙️',
    condition: (s) => s.totalMessages >= 500,
  },
  {
    id: 'deep_thinker',
    name: '深度思考者',
    description: '发送 10 条深度内容',
    icon: '🤔',
    condition: (s) => s.deepMessages >= 10,
  },
  {
    id: 'nonsense_master',
    name: '废话大师',
    description: '发送 20 条废话内容',
    icon: '🗯️',
    condition: (s) => s.nonsenseMessages >= 20,
  },
  {
    id: 'emotional_master',
    name: '情感大师',
    description: '发送 10 条情感内容',
    icon: '❤️',
    condition: (s) => s.emotionalMessages >= 10,
  },
  {
    id: 'frugal',
    name: '省钱达人',
    description: '单条消息消费低于 0.001 元',
    icon: '🧮',
    condition: (s) => s.minCostMessage > 0 && s.minCostMessage < 0.001,
  },
  {
    id: 'spendthrift',
    name: '挥金如土',
    description: '单日消费超过 50 元',
    icon: '💸',
    condition: (s) => s.dailySpent > 50,
  },
  {
    id: 'boss_mentality',
    name: '老板心态',
    description: '使用老板角色发送消息',
    icon: '👔',
    condition: (s) => s.usingBossRole,
  },
  {
    id: 'persistent',
    name: '坚持不懈',
    description: '连续使用 7 天',
    icon: '🏆',
    condition: (s) => s.consecutiveDays >= 7,
  },
  {
    id: 'vip',
    name: 'VIP 用户',
    description: '累计消费超过 100 元',
    icon: '⭐',
    condition: (s) => s.totalSpent > 100,
  },
  {
    id: 'whale',
    name: '消费鲸鱼',
    description: '累计消费超过 500 元',
    icon: '🐋',
    condition: (s) => s.totalSpent > 500,
  },
]

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  target: number
  type: 'messages' | 'deep' | 'nonsense' | 'emotional' | 'spend'
  reward: number
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'chatty_challenge',
    name: '话痨挑战',
    description: '发送 20 条消息',
    icon: '💬',
    target: 20,
    type: 'messages',
    reward: 10,
  },
  {
    id: 'deep_challenge',
    name: '深度挑战',
    description: '发送 5 条深度内容',
    icon: '🤔',
    target: 5,
    type: 'deep',
    reward: 15,
  },
  {
    id: 'frugal_challenge',
    name: '省钱挑战',
    description: '消费低于 1 元',
    icon: '🧮',
    target: 1,
    type: 'spend',
    reward: 10,
  },
  {
    id: 'nonsense_challenge',
    name: '废话挑战',
    description: '发送 10 条废话',
    icon: '🗯️',
    target: 10,
    type: 'nonsense',
    reward: 8,
  },
  {
    id: 'emotional_challenge',
    name: '情感挑战',
    description: '发送 5 条情感内容',
    icon: '❤️',
    target: 5,
    type: 'emotional',
    reward: 12,
  },
]

export interface DailyStats {
  date: string
  messages: number
  spent: number
  deep: number
  nonsense: number
  emotional: number
  challengesCompleted: string[]
}

export interface UserHistory {
  totalSpent: number
  totalMessages: number
  achievements: string[]
  achievementDates: Record<string, string>
  dailyStats: DailyStats[]
  lastActiveDate: string
  consecutiveDays: number
}

const NONSENSE_PATTERNS = [/啊/yi, /嗯/yi, /这个/yi, /那个/yi, /然后/yi]
const DEEP_PATTERNS = [/为什么/yi, /如何/yi, /怎么/yi, /思考/yi]
const EMOTIONAL_PATTERNS = [/安慰/yi, /鼓励/yi, /难过/yi, /加油/yi]

export type ContentType = 'default' | 'nonsense' | 'deep' | 'emotional'

export function detectContentType(text: string): ContentType {
  if (!text) return 'default'
  
  if (NONSENSE_PATTERNS.some(p => p.test(text))) return 'nonsense'
  if (DEEP_PATTERNS.some(p => p.test(text))) return 'deep'
  if (EMOTIONAL_PATTERNS.some(p => p.test(text))) return 'emotional'
  return 'default'
}

export const DEFAULT_BALANCE = 100
export const DAILY_LIMIT = 100

export interface CalculationResult {
  text: string
  cost: number
  contentType: ContentType
  role: string
  characterCount: number
}

export interface DeductionResult {
  cost: number
  newBalance: number
  success: boolean
}

export const SARCASM_COMMENTS: Record<ContentType, string[]> = {
  nonsense: [
    "💬 废话文学带师！您这字儿，比白开水还淡",
    "🗯️ 一个字的信息量都没有，但您说得挺开心",
    "😑 您的废话文学已超过全国 99% 的用户",
    "🤐 说了等于没说，但咱不能歧视废话对吧",
    "📝 每个字都在认真打酱油，致敬！",
  ],
  deep: [
    "🤔 难得说了点有营养的，为您点赞",
    "🧠 深度思考者！您的思想在发光",
    "💡 这话有点东西，看来今天用脑子了",
    "🎯 终于不是废话了，人类之光！",
    "📚 知识的芬芳扑面而来，熏到我了",
  ],
  emotional: [
    "❤️ 暖心话语，已将这份温暖记账",
    "🤗 说得我都感动了，但这不影响扣钱",
    "💌 情绪价值拉满，但Token不打折",
    "🌸 您这温柔，得加钱！",
    "🥰 暖到我了，不过咱亲兄弟明算账",
  ],
  default: [
    "💸 已扣除Token，您的话值这个价",
    "📝 收到，已记录在案",
    "💰 话语费已扣除，不谢",
    "📊 您的发言已计入系统",
    "✅ 好的，扣款成功",
  ],
}

export function getSarcasmComment(contentType: ContentType): string {
  const comments = SARCASM_COMMENTS[contentType]
  return comments[Math.floor(Math.random() * comments.length)]
}

export interface LeaderboardEntry {
  id: string
  name: string
  totalSpent: number
  totalMessages: number
  lastActive: string
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: '💰 土豪王', totalSpent: 1580.5, totalMessages: 520, lastActive: '今天' },
  { id: '2', name: '📚 深度哥', totalSpent: 890.2, totalMessages: 180, lastActive: '今天' },
  { id: '3', name: '💬 话痨王', totalSpent: 650.8, totalMessages: 890, lastActive: '昨天' },
  { id: '4', name: '❤️ 情感天使', totalSpent: 420.3, totalMessages: 95, lastActive: '今天' },
  { id: '5', name: '🗯️ 废话达人', totalSpent: 180.5, totalMessages: 450, lastActive: '昨天' },
]

export interface Task {
  id: string
  name: string
  description: string
  icon: string
  reward: number
  type: 'daily' | 'one-time'
  completed: boolean
}

export const TASKS: Task[] = [
  { id: 'watch_ad', name: '观看广告', description: '看30秒广告', icon: '📺', reward: 5, type: 'daily', completed: false },
  { id: 'invite', name: '邀请好友', description: '邀请1位新用户', icon: '👥', reward: 20, type: 'one-time', completed: false },
  { id: 'share', name: '分享战绩', description: '分享到社交媒体', icon: '📤', reward: 3, type: 'daily', completed: false },
  { id: 'check_in', name: '每日签到', description: '签到领奖励', icon: '📅', reward: 1, type: 'daily', completed: false },
]

export interface Subscription {
  tier: 'free' | 'pro' | 'vip'
  name: string
  price: number
  features: string[]
}

export const SUBSCRIPTIONS: Subscription[] = [
  { tier: 'free', name: '免费版', price: 0, features: ['每日100元额度', '基础角色', '基本统计'] },
  { tier: 'pro', name: 'Pro会员', price: 19, features: ['每日500元额度', '所有角色', '高级统计', '无广告', '专属成就'] },
  { tier: 'vip', name: 'VIP会员', price: 49, features: ['无限额度', '自定义费率', '专属客服', '优先体验新功能', '线下活动资格'] },
]
