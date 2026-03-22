# HumanToken 项目优化计划

> 项目目录：`D:\code\opencodeproj\shuohua`
> 记录时间：2026-03-22

---

## 一、技术债务

| # | 问题 | 优先级 | 状态 | 位置 |
|---|------|--------|------|------|
| T1 | `detectContentType` 前后端各写了一份，维护成本高 | 高 | ✅ 已完成 | `shared/config.ts`, `shared/config.js` |
| T2 | API 接口已实现但前端未调用，计费全在前端 | 高 | ✅ 已完成 | `client/src/App.tsx` |
| T3 | 无数据持久化，刷新页面余额清零 | 高 | ✅ 已完成 | `client/src/App.tsx` (localStorage) |
| T4 | README 提到 SQLite 未实现 | 中 | ✅ 已完成 | README.md |
| T5 | 正则每次渲染都重新创建 | 低 | ✅ 已完成 | `shared/config.ts` |

**T1、T2、T3 已完成修复方案：**
- ✅ 抽取共享配置到 `shared/config.ts` 和 `shared/config.js`（monorepo 结构）
- ✅ 前端改为调用 `/api/calculate` 预估，调用 `/api/deduct` 扣费
- ✅ 使用 localStorage 实现本地持久化

---

## 二、代码质量

| # | 问题 | 优先级 | 状态 | 位置 |
|---|------|--------|------|------|
| C1 | 无单元测试 | 中 | ✅ 已完成 | vitest + `server/tests/` |
| C2 | TypeScript 类型偏弱（如 `timestamp: Date`） | 低 | ✅ 已完成 | `client/src/App.tsx` |
| C3 | API 调用无 try-catch | 中 | ✅ 已完成 | `client/src/App.tsx` |
| C4 | 费率写死在代码里 | 中 | ✅ 已完成 | `shared/config.ts` |
| C5 | 魔法数字（初始余额100） | 低 | ✅ 已完成 | `shared/config.ts` |

---

## 三、安全性

| # | 问题 | 优先级 | 状态 | 修复方案 |
|---|------|--------|------|----------|
| S1 | API 无认证 | 高 | ✅ 已完成 | JWT 认证 (`server/src/index.js`) |
| S2 | 无速率限制 | 高 | ✅ 已完成 | `express-rate-limit` (`server/src/index.js`) |
| S3 | 后端 `detectContentType` 对空字符串处理 | 中 | ✅ 已完成 | 添加 `if (!text) return 'default'` |

---

## 四、功能增强（待开发）

| # | 功能 | 描述 | 复杂度 |
|---|------|------|--------|
| F1 | 用户系统 | 支持多用户、登录注册 | 高 |
| F2 | 充值功能 | 余额耗尽后可充值（非仅每日重置） | 中 |
| F3 | 本地历史记录 | localStorage 或数据库持久化 | 低 |
| F4 | 声音反馈 | 发送消息时播放扣费音效 | 低 |
| F5 | 动画效果 | 余额变化、消息发送的微交互 | 低 |
| F6 | 国际化 (i18n) | 支持中英文切换 | 中 |
| F7 | 成就系统 | 发送特定内容解锁成就 | 中 |
| F8 | 排行榜 | 按消费排名 | 高 |

---

## 五、UI/UX 改进

| # | 改进点 | 当前状态 |
|---|--------|----------|
| U1 | 消息列表显示时间戳 | ✅ 已完成 |
| U2 | 余额进度条增加动画 | ✅ 已完成 (transition + animate-pulse) |
| U3 | "死亡模式"体验优化 | ✅ 已完成 |
| U4 | 暗黑模式切换 | ✅ 已完成 |
| U5 | 响应式布局优化 | ✅ 已完成 |

---

## 六、架构演进（可选）

### 方案 A：轻量化
```
client/ (React + Vite)
server/ (Express + SQLite)  ← 用 lowdb 或 better-sqlite3
```

### 方案 B：Monorepo
```
packages/
  shared/      ← 共享配置、类型
  client/      ← React
  server/      ← Express
```

### 方案 C：全栈重构
```
前端: Next.js (App Router) + TailwindCSS
后端: Next.js API Routes / Hono / Fastify
数据库: SQLite (via Drizzle ORM) / PostgreSQL
部署: Vercel / Docker
```

---

## 七、优先级建议

### 第一阶段（快速修复）✅ 已完成
- [x] T1: 抽取共享配置
- [x] T2: 前端接入 API
- [x] T3: 添加 localStorage 持久化
- [x] S3: 修复空字符串处理

### 第二阶段（体验提升）已完成 ✅
- [x] T5: 优化正则创建
- [x] C4: 费率配置化
- [x] U1-U2: UI 改进（时间戳、进度条动画）
- [x] F3: 本地历史记录 (localStorage)
- [x] F9: 自定义角色（添加、编辑、删除角色）
- [x] U3-U5: UI 改进（死亡模式、暗黑模式、响应式）
- [x] C2-C3: 完善错误处理
- [x] T4: README SQLite 描述修正
- [x] C1: 单元测试 (vitest)
- [x] S1-S2: 安全加固（JWT + 速率限制）

### 第三阶段（长期规划）
- [ ] F1: 用户系统
- [ ] S1-S2: 安全加固
- [ ] C1: 测试覆盖
- [ ] 架构演进

---

## 八、相关文件

- `client/src/App.tsx` — 前端主组件
- `server/src/index.js` — 后端 API（含 JWT 认证、速率限制）
- `shared/config.ts` — TypeScript 共享配置
- `shared/config.js` — JavaScript 共享配置
- `client/vite.config.ts` — Vite 配置（含路径别名）
- `client/tsconfig.json` — TypeScript 配置（含路径别名）
- `client/package.json` — 前端依赖
- `server/package.json` — 后端依赖
- `server/tests/config.test.js` — 单元测试
- `server/vitest.config.js` — 测试配置
- `OPTIMIZATION.md` — 项目优化跟踪
- `README.md` — 项目说明文档
