# Chronos 收尾工程设计规格

- 日期：2026-06-18
- 作者：收尾负责人（本轮全部由一人完成，不再区分原作者）
- 状态：待评审

## 1. 背景与目标

Chronos 是一款"客户端 + 服务端 + AI 服务"三层架构的智能学习任务管理系统（详见 `docs/项目开发计划书v1.5.md`、`docs/Chronos_软件需求规格说明书_v2.2.md`）。当前仓库由多人并行开发，存在两条发散的开发线（`codex/*` 已并入 main 的实现线，与 `feat/*` 团队模块线），导致：

1. 两个未合并 PR 需要处理（一个后端、一个前端，状态分别为冲突与被阻塞）。
2. UI 未达到"精致、美观、高级、交互丝滑"的目标，需要全面重写。
3. P0/P1 功能未补齐，且 CI 的后端检查被禁用。

本规格定义收尾工程的范围、策略与验收标准。**最终交付形态为基于 Electron 的桌面应用**（Windows/macOS/Linux），并保留 PWA 作为移动端访问入口。

### 1.1 已确认的关键决策

| 维度 | 决策 |
|---|---|
| PR 处理 | 解决冲突合并 PR #67（后端 M2，保留全部可借鉴实现 + 测试）；PR #61（前端 M1）只吸收同步/存储/冲突逻辑，UI 由本轮重写覆盖 |
| UI 风格 | 以用户提供的 demo 截图为基准——浅色、通透、现代极简带暖意的生产力仪表盘，主色靛蓝 + 彩色强调芯片；参考成熟商业产品（Things / 滴答清单 / Sunsama 气质）但不照抄 |
| 前端依赖 | 放开。引入 **Tailwind CSS**（设计系统）+ **Framer Motion**（动效）+ **Recharts**（统计图表） |
| 功能范围 | 补齐开发计划中的 **P0 + P1** 全部功能 |
| AI | 真实接入，使用 **OpenAI 兼容协议**（可配 baseURL / model / apiKey），用户自备 Key；BYOK 服务端加密存储 |
| 动画 | 列为一等目标：页面转场、列表入场、勾选/状态流转、数字滚动、骨架屏、悬浮反馈 |
| 主题 | 浅色为主 + 完整深色变体 + 切换 |
| 桌面打包 | 修复 Electron + electron-builder，让 `windows-installer.yml` 的 release action 正常产出安装包 |
| 落地方式 | 在集成分支完成全部工作并本地验证；推送到 `main` 前先经用户确认 |

## 2. 现状分析

### 2.1 两个未合并 PR

- **PR #67**（`feat/m2-learning-timer-stats-ai`，后端为主，+3910/−19，48 文件，`CONFLICTING`）：实现学习日志、番茄钟计时、统计、AI 设置加密、AI 供应商适配（DeepSeek/MiMo/Mock）、AI 拆解&复盘、同步服务，以及成套后端测试（含 `schema-test.sql`、test `application.yml`）。冲突根因：基于 6/2 的旧 main，落后 61 个提交。冲突集中在 `sync`（SyncService/SyncPushResponse）、`ai`（AiController/AiService）、`entity/FocusSession`、`application.yml`、`pom.xml`。
- **PR #61**（`feat/m1-05-06-08-09`，前端为主，+2016/−4960，44 文件，`MERGEABLE` 但 `BLOCKED`）：认证接入、IndexedDB 存储重构、同步 Worker、冲突解决、`SyncStatusIndicator`、`useSync`。大量删除源于一次客户端重写，与本轮 UI 重写高度重叠——故只吸收其非 UI 逻辑。

### 2.2 当前实现 vs 计划缺口

- **后端**（main）：auth / project / task / dashboard / ai 已是 DB 支撑的真实服务。缺：sync 服务实现、番茄钟、统计、学习日志完整后端、AI 真实适配器与设置——均由 PR #67 提供。
- **前端**（main）：8 个页面 + 本地优先存储（IndexedDB + outbox）+ 同步骨架。弱/缺：UI 精致度、统计图表、番茄钟交互、习惯打卡、日历 iCal 导入、主题切换、PWA。
- **CI**（`.github/workflows/ci.yml`）：`backend-test`、`mysql-smoke` 被 `if: false` 禁用，目前只跑前端构建。

### 2.3 OpenAI 兼容性

PR #67 的 `DeepSeekProvider` 已是 `baseUrl + /v1/chat/completions` + `Bearer` 认证 + `model` 参数的 OpenAI 兼容形态，`AiProviderFactory` 按名称（deepseek/mimo/mock）选择 provider。泛化为通用 OpenAI 兼容 provider 成本低。

## 3. 实施方案（三阶段）

采用分阶段、每阶段可独立验证的策略。阶段 1 先打底后端与 CI，阶段 2 建立设计系统并重写 UI，阶段 3 在稳定底座上补齐 P0/P1 功能。整个工作在集成分支 `codex/finishing` 上进行。

### 阶段 1：后端整合 + CI 打底

**目标**：得到一个可编译、测试通过、功能完整的后端，CI 真正校验后端。

1. **合并 PR #67**：以 main 为基础，将 `feat/m2-learning-timer-stats-ai` 的提交整合进集成分支，手工解决以下冲突：
   - `sync/SyncService`、`sync/dto/SyncPushResponse`、`SyncController`：合并双方逻辑，保留 PR #67 的冲突计数与 push/pull/resolve 完整实现，对齐 main 的现有控制器签名。
   - `ai/AiController`、`ai/AiService`：保留 PR #67 的拆解/复盘/设置能力，合并 main 已有接口。
   - `entity/FocusSession`、`application.yml`、`pom.xml`：取并集（新增字段、AI provider 配置、新增依赖）。
2. **吸收 PR #61 的同步/存储/冲突逻辑**（不取其 UI）：评估 `services/syncService.ts`（+477）、`hooks/useSync.ts`、`components/SyncStatusIndicator.tsx`、`hooks/useConflict.ts`、storage 仓储改动，将其中正确的逻辑整合进现有前端存储层；UI 表现在阶段 2 重做。
3. **AI 统一为 OpenAI 兼容 Provider**：新增 `OpenAiCompatibleProvider`（baseURL/model/apiKey → `/v1/chat/completions`），`AiProviderFactory` 支持 `openai` 名称并由 BYOK 设置驱动；DeepSeek/MiMo 作为预置 baseURL 兼容存在。BYOK 加密沿用 PR #67 的 `AiSettingsService`（`CHRONOS_AI_MASTER_KEY`）。
4. **修复 CI**：
   - 去掉 `backend-test`、`mysql-smoke` 的 `if: false`，使其真正运行。
   - 后端单测使用 PR #67 带来的 `src/test/resources/application.yml` + `schema-test.sql`（H2 或容器 MySQL），保证 `mvnw test` 不依赖外部 DB 即可通过。
   - 确认 `mvnw verify` 的 JaCoCo 覆盖率产出。
   - 前端 job 增加 lint/typecheck 与 `vitest run`（当前 CI 只 build，未跑前端测试）。
5. **验证**：`./server/mvnw test` 全绿；`docker compose up` 后 `/api/health` 为 UP。

### 阶段 2：设计系统 + UI 全量重写

**目标**：建立可复用的设计系统与组件库，按 demo 重写全部界面，动效到位。

1. **引入并配置** Tailwind CSS、Framer Motion、Recharts；建立设计 token：
   - 色板：主色靛蓝（如 `#4F46E5`/`indigo`）+ 语义色（成功绿、警示琥珀、危险红、信息蓝、专注紫、打卡橙）；中性灰阶；浅色/深色两套。
   - 字阶、圆角（8/12/16）、阴影（弥散柔阴影）、间距、动效曲线（统一 easing/duration）。
   - 主题通过 CSS 变量 + Tailwind `dark:` 实现，切换持久化到本地。
2. **基础组件库**（`client/src/components/ui/`）：Button、Card、Badge（状态/优先级）、Input/Select/Textarea、Checkbox、Modal/Dialog、Dropdown/Menu、Tooltip、Toast、Tabs、Avatar、ProgressRing、Skeleton、EmptyState、统计卡 StatCard。
3. **应用骨架 AppLayout**：左侧固定导航（品牌 + 图标导航 + 底部用户卡，选中态蓝色渐变胶囊）、顶部搜索栏 + 通知铃、主内容区；响应式（窄屏抽屉式导航，为 PWA 做准备）。
4. **重写 8 个页面**：今日看板、项目、任务、日历、习惯、日志、统计、设置——严格对齐 demo 的卡片化、留白与配色。
5. **动效规范**：路由转场（Framer Motion `AnimatePresence`）、列表 stagger 入场、任务勾选与状态流转动画、统计数字滚动、加载骨架屏、按钮/卡片悬浮微反馈。尊重 `prefers-reduced-motion`。
6. **验证**：`npm run build --workspace client` 通过；`vitest` 通过；手动走查各页面浅/深色与窄屏表现。

### 阶段 3：P0 + P1 功能补齐

按需求规格与开发计划补齐：

- **P0**：认证（登录/注册/Token 拦截，保留本地演示模式）、项目管理、任务 CRUD + 状态流转、今日看板、本地持久化、基础同步、基础统计。
- **P1**：
  - **任务增强**：拖拽排序、子任务拆分、标签、优先级。
  - **多视图日历**：周/月视图 + iCal（.ics）导入。
  - **习惯打卡 + 成就**：周期性习惯、每日打卡、连续天数、成就徽章。
  - **番茄钟专注**：计时器（25/5 可配）、专注时段统计、状态持久化（已有 `timerState` 存储 + PR #67 后端）。
  - **统计看板**：完成率、时间分配、专注时长趋势（Recharts）。
  - **Markdown 日志**：编辑 + 实时预览、资料链接、检索归档。
  - **AI 拆解 & 复盘**：目标拆解为任务树草稿（确认后落库）、阶段复盘建议；真实 OpenAI 兼容调用，失败优雅降级。
  - **主题与个性化**：深/浅色切换、强调色。
  - **PWA**：manifest + service worker，移动端可访问并添加到主屏。
- **桌面打包**：恢复 `client/package.json` 的 `electron`/`electron-builder` 依赖与 `electron:dev`、`dist:win` 脚本，补 electron-builder 配置（产物输出 `client/release/*.exe`），使 `windows-installer.yml` 的 release action 可用。
- **验证**：对照开发计划 2.4 验收标准逐项自测；前后端联调关键路径。

## 4. 架构与边界

- 前端保持**本地优先**：UI → hooks → 存储仓储/服务；写操作走 outbox，联网后由 syncService 推送。新增 UI 组件层 `components/ui/` 与设计 token，页面只做展示与编排。
- 后端保持**按功能模块**分层（controller/service/dto + entity/mapper），统一 `ApiResponse` 包络，MyBatis-Plus（雪花 ID + 逻辑删除 `deletedAt`），Sa-Token 认证。
- AI 必须"可关闭、可失败、可替换"：provider 抽象 + BYOK；不可用时核心功能不受影响。
- 同步沿用触发/定时 REST，基于版本号 + 更新时间检测冲突；不引入 WebSocket/MQ。

## 5. 测试策略

- **后端**：JUnit + Spring Boot Test；service 层单测（PR #67 已带 timer/stats/learninglog/ai/provider 测试）；用 H2/测试 schema 让 `mvnw test` 无需外部 DB。
- **前端**：Vitest + Testing Library；保留并扩展 storage/hooks 测试；新增关键交互组件测试。
- **CI 门禁**：前端 build + typecheck + vitest；后端 `mvnw verify`；MySQL 冒烟（health 探活）。
- **手动验收**：对照开发计划 §2.4 功能/性能/兼容性清单。

## 6. 验收标准

1. PR #67 内容已整合进集成分支并解决全部冲突；后端 `mvnw test` 全绿。
2. CI 三个 job（前端、后端测试、MySQL 冒烟）全部启用且通过。
3. UI 全量重写完成，8 个页面对齐 demo，浅/深主题与动效到位，`npm run build` 通过。
4. P0 + P1 功能可演示运行；AI 拆解经真实 OpenAI 兼容调用产出草稿、可确认落库、失败可降级。
5. Electron 打包脚本与 electron-builder 配置就绪，`dist:win` 可本地产出安装包，release action 可运行。
6. `record.md` 记录关键改动；推送 `main` 前经用户确认。

## 7. 风险与权衡

- **PR #67 大范围冲突合并**：手工解决可能引入回归 → 合并后立即跑后端测试套件兜底。
- **UI 全量重写工作量大**：分阶段交付，先骨架 + 设计系统再逐页；动效统一封装避免重复。
- **真实 LLM 不稳定/需联网**：BYOK + 超时重试 + mock 兜底；演示可切回 mock。
- **Electron 工具链缺失**：需重新确定与 React 19/Vite 6 兼容的 electron/electron-builder 版本，先验证最小可打包再接 CI。
- **范围大、单分支推进**：阶段间设检查点，每阶段本地验证通过再继续。

## 8. 不在本轮范围

Redis、RabbitMQ、K8s、RAG 长期记忆、复杂冲突自动合并、防干扰模式与专注评分（P2），以及白噪音音频等次要增强，按需求文档维持占位，不在本轮实现。
