# HumanToken 🌐💰

> **"当AI用Token收费时，人类也该觉悟了"**

[![GitHub stars](https://img.shields.io/github/stars/human-token/human-token?style=social)](https://github.com/human-token/human-token)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 项目简介

受黄仁勋GTC 2026大会Token经济学启发，我们提出了一个灵魂拷问：

> **AI靠Token收费，凭什么人类说话免费？**

HumanToken 将AI的Token计费模式完美复刻到人类身上 —— 每次说话都是一次API调用，余额不足就"断网"（说不出话）。

这是一个**讽刺性概念验证项目**，旨在引发关于AI经济学的思考，同时给你带来欢乐。

## ✨ 核心功能

### 🗣️ 说话扣费系统
- 每日初始"话语额度"（类似AI的免费tier）
- 每次说话按字数/时长实时扣费
- 余额耗尽时：界面变灰，出现"网络波动"提示 🙀

### 💵 话语定价API
```javascript
const RATES = {
  "废话文学": 0.001,      // 如"啊这个那个嗯"
  "普通对话": 0.01,       // 日常聊天
  "深度思考": 0.1,        // 讨论问题/解决问题
  "情绪价值": 0.5,        // 安慰、鼓励、倾听
  "老板发言": 0,          // 免费！（潜规则）
}
```

### 👥 差异化收费
| 角色 | 费率 | 说明 |
|------|------|------|
| 老板/领导 | 免费 | 潜规则 |
| 程序员 | +50% | 技术术语附加费 |
| 销售 | +30% | "洗脑值"附加费 |
| 产品经理 | +100% | 改需求费用 |

### 📊 仪表盘
- 📈 今日已说话字数/花费
- ⚠️ 余额告急预警
- 📅 月度消费报表
- 🔥 "最败家的一句话"排行榜

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Node.js + Express + SQLite
- **实时**: WebSocket 实时扣费

## 🚦 快速开始

```bash
# 克隆项目
git clone https://github.com/human-token/human-token.git
cd human-token

# 安装依赖
cd client && npm install
cd ../server && npm install

# 启动后端
cd server && npm run dev

# 启动前端（新终端）
cd client && npm run dev
```

访问 `http://localhost:5173` 开始体验！

## 🎮 使用方式

1. **输入话语** - 在输入框中输入你想说的话
2. **观察扣费** - 实时显示这句话要花多少钱
3. **发送消息** - 确认扣费，消息"发出"
4. **余额耗尽** - 进入"断网"模式，只能看余额

## 🎯 适用场景

- 🔥 GitHub Trending 吸引眼球的创意项目
- 💡 AI Token经济学科普演示
- 😄 朋友间的欢乐整蛊工具
- 📚 引发关于"人类vs AI"讨论的触发器

## 📄 License

MIT © 2026 HumanToken