# PR #39: 前端认证系统实现与仓库结构重组

## 变更范围说明

⚠️ **本次 PR 是一次仓库结构重组**，将原有的前后端混合仓库调整为独立的前端客户端仓库。

- **移除内容**：`server/` 后端目录及相关 CI 配置（后端服务将独立维护）
- **保留内容**：`client/` 前端 Electron + React 应用
- **目标**：聚焦桌面端客户端开发，后端 API 通过独立服务提供

---

## 功能实现

### 认证系统
- 登录/注册界面，对接后端 REST API
- 会话持久化（localStorage + Zustand）
- Token 自动附加到请求头
- 会话过期自动跳转登录页

### 动态 API 配置
- 登录页可配置 API 基地址
- 健康检查按钮验证服务可用性
- 实时同步 API 地址变更（无需重启）

### 离线模式支持
- 检测网络状态，无网时进入离线模式
- 7 天会话宽限期
- 离线状态持久化

### Electron 桌面端适配
- `HashRouter` 替代 `BrowserRouter`（兼容 `file://` 协议）
- 客户端路由跳转替代整页刷新
- 打包后路由正常工作

---

## 技术栈

- Electron + Vite + React + TypeScript
- Zustand 状态管理
- Axios HTTP 客户端
- react-router-dom (HashRouter)

---

## 验证

```bash
npm install
npm run build --workspace client
npm test --workspace client
```

---

## 后续计划

- 后端服务将迁移至独立仓库
- 前后端通过 API 契约进行联调
