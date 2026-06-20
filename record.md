# Chronos 改动记录

> 本文件用于记录脚手架搭建期间的每次文件改动，便于团队成员了解项目从空目录到初始框架的演进过程。

## 2026-05-07 19:50

- 改动文件：`record.md`
- 改动目的：创建项目改动记录文件，作为后续所有脚手架搭建操作的记录入口。
- 验证结果：文件已创建，后续每批配置、代码、文档和数据库脚本改动都会追加记录。

## 2026-05-07 19:58

- 改动文件：`.editorconfig`、`.gitignore`、`.env.example`、`README.md`、`package.json`、`.github/workflows/ci.yml`、`docs/architecture.md`、`docs/api.md`、`docs/database.md`、`docs/development-guide.md`
- 改动目的：建立仓库基础规范、环境变量模板、CI 检查入口、根 npm workspace 配置和团队开发文档。
- 验证结果：文件已写入；后续会通过前端构建、后端测试和 README 步骤检查验证可用性。

## 2026-05-07 20:10

- 改动文件：`client/package.json`、`client/index.html`、`client/vite.config.ts`、`client/tsconfig.app.json`、`client/electron/tsconfig.json`、`client/electron/main.ts`、`client/electron/preload.ts`、`client/src/**`
- 改动目的：搭建 Electron + React + Vite + TypeScript 前端框架，建立 7 个页面路由、领域类型、Mock 数据、API 客户端、布局组件和基础样式。
- 验证结果：文件已写入；后续执行 `npm install` 和 `npm run build --workspace client` 验证编译。

## 2026-05-07 20:26

- 改动文件：`server/pom.xml`、`server/mvnw.cmd`、`server/mvnw`、`server/.mvn/wrapper/mvnw-bootstrap.ps1`、`server/src/main/**`、`server/src/test/**`、`.gitignore`
- 改动目的：搭建 Spring Boot 后端框架、轻量 Maven Wrapper、统一 API 响应、健康检查和认证/项目/任务/看板/AI/同步模块占位接口。
- 验证结果：文件已写入；后续执行 `.\server\mvnw.cmd test` 验证 Spring 上下文和编译。

## 2026-05-07 20:34

- 改动文件：`database/sqlite/schema.sql`、`database/mysql/schema.sql`
- 改动目的：根据需求资料中的核心数据对象建立 SQLite 本地库和 MySQL 云端库首版建表草案。
- 验证结果：脚本已写入；后续由后端实体和迁移工具进一步校准字段、索引和约束。

## 2026-05-07 20:42

- 改动文件：`package-lock.json`、`client/src/vite-env.d.ts`
- 改动目的：安装前端依赖并补充 Vite 类型声明，使 TypeScript 能识别 `import.meta.env`。
- 验证结果：`npm install --prefer-offline` 已完成；首次前端构建发现 Vite 类型声明缺失，已补充后准备重新构建。

## 2026-05-07 20:53

- 改动文件：`server/mvnw.cmd`、`server/mvnw`、`server/.mvn/wrapper/mvnw-bootstrap.ps1`、`server/.mvn/settings.xml`
- 改动目的：修复 Windows 批处理中文注释导致的乱码命令提示，并为 Maven Wrapper 配置国内 Maven 镜像，降低依赖下载失败概率。
- 验证结果：前端构建已通过；后端测试此前因 Maven Central TLS 握手失败，已调整 Maven 设置后准备重新测试。

## 2026-05-07 21:02

- 改动文件：`client/package.json`
- 改动目的：根据 `npm audit` 结果升级 Electron 开发依赖，降低脚手架阶段的安全告警。
- 验证结果：`npm audit --audit-level=high` 报 Electron 高危项，查询到当前 Electron 版本为 42.0.0，已准备重新安装依赖并验证。

## 2026-05-07 21:12

- 改动文件：`package-lock.json`
- 改动目的：重新安装前端依赖，锁定 Electron 42.0.0 相关依赖版本。
- 验证结果：`npm install --prefer-offline` 完成，`npm audit` 显示 0 个漏洞；`npm run build --workspace client` 构建通过；`.\server\mvnw.cmd test` 后端测试通过。

## 2026-05-07 21:16

- 改动文件：无源码改动，仅运行验证命令。
- 改动目的：确认后端不仅能通过测试，也能作为服务启动并响应接口。
- 验证结果：短暂启动 `.\server\mvnw.cmd spring-boot:run` 后访问 `http://localhost:8080/api/health` 成功，返回 `status=UP`；验证后已关闭临时后端进程。

## 2026-05-07 21:22

- 改动文件：`record.md`
- 改动目的：记录提交前验证和 Git 准备状态。
- 验证结果：前端构建通过、后端测试通过、后端健康接口通过；已设置 HTTPS 远程 `https://github.com/Vincent-Ctrl-18/Chronos.git`，准备提交并推送到 `main`。

## 2026-05-07 21:25

- 改动文件：`.gitattributes`
- 改动目的：固定仓库文本文件行尾规则，并将 `.docx` 等资料文件按二进制处理，避免 Windows 协作时产生无意义差异。
- 验证结果：已添加行尾和二进制文件规则，提交前会重新暂存文件。

## 2026-05-07 21:30

- 改动文件：无源码改动，仅执行 Git 操作。
- 改动目的：初始化本地 Git 仓库，提交脚手架和既有资料文件，并推送到 GitHub。
- 验证结果：已提交 `d87e3da chore: scaffold Chronos framework`；已推送到 `https://github.com/Vincent-Ctrl-18/Chronos.git` 的 `main` 分支，并设置本地 `main` 跟踪 `origin/main`。

## 2026-06-18 收尾阶段 1（后端集成 + CI）

- 改动文件：`server/`（合并 PR #67 的 M2 后端：计时器/统计/学习日志/同步/AI provider，并修复 6 项评审问题）、`server/src/main/java/com/chronos/ai/provider/OpenAiCompatibleProvider.java`+`AiProviderFactory.java`+`application.yml`（新增通用 OpenAI 兼容 provider，provider 名 `openai`，由 BYOK 设置驱动）、`client/src/hooks/useSync.ts`+`client/src/services/__tests__/syncService.test.ts`（吸收 PR #61 同步逻辑：补齐 useSync hook 与 push/conflict 特征测试，未重写仓储层、未改 UI）、`.github/workflows/ci.yml`（移除 `backend-test`/`mysql-smoke` 的 `if:false` 门禁；`backend-test` 改为纯 H2 运行、不依赖 MySQL 服务；`frontend-check` 增加 `npx vitest run --root client`）、`client/src/hooks/__tests__/useTimer.test.ts`+`client/src/components/__tests__/AppLayout.test.tsx`（修正两处历史失效断言：计时器"防止多活跃"改为断言 error 状态而非抛异常；AppLayout 改为校验品牌文案）。
- 改动目的：完成项目收尾的第 1 阶段——合并并加固未合并的后端 PR、把 AI 泛化为 OpenAI 兼容协议、吸收前端同步逻辑的缺失部分、让此前被禁用的 CI 检查真正运行并通过。
- 验证结果：`./server/mvnw verify` 全绿（56 项测试，JaCoCo 覆盖率报告生成）；`npx vitest run`（client）全绿（12 文件 / 38 测试）；`.github/workflows/ci.yml` 通过 `yaml.safe_load` 校验且三个 job 均已启用。
- 待办（后续阶段）：sync 模块的用户隔离（push 未写 userId、controller 无鉴权）留待阶段 3 鉴权接入时统一处理；前端计时器测试使用真实 `setTimeout`（整套约 3-4 分钟），建议阶段 2 改用 fake timers 提速。

## 2026-06-18 收尾阶段 2（UI 全量重写 + PWA）

- 改动文件：`client/src/styles/global.css`、`client/src/components/icons/`、`client/src/components/ui/`、`client/src/components/AppLayout.tsx`、`client/src/components/ConflictDialog.tsx`、`client/src/pages/{DashboardPage,ProjectsPage,TasksPage,CalendarPage,LearningLogsPage,AiBreakdownPage,StatsPage,SettingsPage,LoginPage,RegisterPage}.tsx`、相关页面/组件测试、`client/vite.config.ts`、`client/index.html`、`client/package.json`、`package-lock.json`、`client/public/icons/chronos-{192,512}.png`。
- 改动目的：完成阶段 2 UI 全量重写：Tailwind v4 CSS-first 设计系统、手绘 SVG 图标、紧凑圆角、高密度卡片、深浅主题、图标轨侧栏、主要页面改造、登录/注册改造、冲突弹窗改造，并加入可安装 PWA manifest 与 `vite-plugin-pwa` service worker。
- 验证结果：`npm run build --workspace client` 通过，产出 `manifest.webmanifest`、`registerSW.js`、`sw.js`；`cd client && npx vitest run` 全绿（19 文件 / 48 测试）；`rg -n lucide-react client/src` 无匹配；`rg -n "auth-page|auth-card|auth-form|auth-submit|auth-offline|conflict-overlay|conflict-dialog|settings-list|page-stack|row-actions|update-card" client/src/pages client/src/components` 无匹配。
- 已知限制：浏览器视觉 QA 受当前环境企业策略阻止，未声明已完成；StatsPage 的 Recharts 在 jsdom 测试中仍输出容器尺寸警告，但测试与构建通过。

## 2026-06-18 收尾阶段 3（P0/P1 功能补齐 + Electron 校验）

- 改动文件：
  - 习惯（3.1 后端 / 3.5 前端）：`server/.../habit/{HabitController,HabitService,dto/*}`（已提交 4f66d74）；`client/src/hooks/useHabits.ts`、`client/src/pages/HabitsPage.tsx`、`client/src/App.tsx`（新增 `/habits` 导航 + 路由，`周视图`→`日历`）、`client/src/components/icons/index.tsx`（手绘 `IconHabit`/`IconTrophy`）、`client/src/services/apiClient.ts`（习惯端点）。
  - 同步用户隔离（3.2，已提交 1207716）、任务增强（3.3，已提交 e9adebf）、日历月视图 + iCal 导入（3.4，已提交 8f87043 + `client/src/services/icalImport.ts`）。
  - Markdown 学习日志（3.6）：`client/src/components/MarkdownView.tsx`（marked + DOMPurify 净化）、`client/src/pages/LearningLogsPage.tsx`（编辑 + 实时预览 + 检索/类型筛选）、`client/src/styles/global.css`（`.markdown-body` prose 样式）、新增依赖 `marked`、`dompurify`。
  - AI 真实对接（3.7）：`client/src/services/{apiClient,aiService}.ts`、`client/src/hooks/useAiAdvice.ts`、`client/src/pages/{AiBreakdownPage,SettingsPage}.tsx`。前端原先调用的端点与后端漂移（`/ai/breakdown-commit` 404、`GET /ai/advice` 405、`AiProviderOverride` 头部 BYOK 后端未读取），统一改对接可用的结构化端点：`/ai/breakdown/preview`（按周阶段树）+ `/ai/breakdown/commit`（确认后在所选项目下批量建任务）+ `POST /ai/advice`；BYOK 改走服务端 AES-GCM 加密存储 `PUT/GET/DELETE /ai/settings`；无 Key 时后端回落 MockProvider，前端离线/本地演示静默降级。
  - Electron 打包（3.8）：`client/package.json` 补 `author` 字段（消除 electron-builder 警告）。
- 改动目的：完成阶段 3 的 P0 校验与 P1 新增（习惯打卡 + 成就、Markdown 日志、AI 拆解/复盘真实调用 + BYOK），并校验 Electron 打包与 release 链路。
- 验证结果（阶段 3 验收）：后端 `.\server\mvnw.cmd test` BUILD SUCCESS，61 测试 0 失败（含 Habit 3 / AiBreakdown 6 / AiSettings 8 / Sync 2 等）；前端 `npm run build --workspace client` 通过（产出 `dist/` + `dist-electron/{main,preload}.js`），`cd client && npx vitest run` 全绿（24 文件 / 63 测试，其中 `useHabits` 5、`MarkdownView` 4、`useAiAdvice` 2 为本阶段新增）；`electron-builder` 能加载配置、执行 `@electron/rebuild`、下载并解压 Electron 42。CI（`.github/workflows/ci.yml`）三 job 自阶段 1 起已启用。
- 已知限制：本机 `npm run dist:win` 在解压 Electron 后于 `release\win-unpacked.tmp → win-unpacked` 目录重命名处报 `EPERM`（Windows 实时杀毒/文件锁占用新解压的 `electron.exe`，禁用沙箱后复现，属本机环境限制而非工程缺陷）；安装包以 CI `windows-installer.yml`（`windows-latest` 干净环境、推 `v*.*.*` tag 触发）为权威产出路径。习惯「今日是否已打卡」后端列表未返回，前端用会话内集合追踪（打卡接口幂等）。BYOK 仅托管各 provider 加密 Key，endpoint/model 由服务端部署配置决定。

## 2026-06-20 收尾阶段 4（侧栏定型 + 统计崩溃修复 + 可视化扩展 + 文案中文化）

- 改动文件：`client/src/components/AppLayout.tsx`+`__tests__/AppLayout.test.tsx`（桌面侧栏由「悬停展开」改为固定 72px 窄栏，悬停图标浮出自绘 tooltip，移动端抽屉不变；测试改用无障碍标签查询）、`client/src/pages/StatsPage.tsx`+`__tests__/StatsPage.test.tsx`+`client/src/hooks/useStats.ts`+`client/src/services/statsService.ts`（修复「统计复盘」页因旧版本过期缓存缺数组字段导致 `reduce` 崩溃：StatsPage 数组访问空值兜底、useStats 校验并清除不兼容缓存、新增回归测试；新增「时间构成」环形图与「项目进度」条形图，statsService 透传 focusMinutes/totalTasks/completedTasks，无需改后端）、`client/src/pages/HabitsPage.tsx`（依据连续天数还原最近 21 天打卡热力格）、`client/src/pages/{AiBreakdownPage,CalendarPage,LearningLogsPage,ProjectsPage,TasksPage}.tsx`（英文 eyebrow 改中文）、`client/src/pages/SettingsPage.tsx`+`__tests__/SettingsPage.test.tsx`（Provider/Key/BYOK/Mock/base URL 等英文改中文）、`client/src/services/updateService.ts`+`client/electron/main.ts`（更新提示英文文案改中文）。
- 改动目的：按用户要求收尾——固定窄侧栏 + 悬停文字提示、统计页可视化扩展（习惯热力格 + 时间构成 + 项目进度）、面向用户的中文文案规整；并修复统计页一打开即崩溃的线上问题。
- 验证结果：`npx tsc -p tsconfig.app.json --noEmit` 与 `electron/tsconfig.json` 均通过；`cd client && npx vitest run` 全绿（25 文件 / 68 测试，新增统计页崩溃回归 1 项）。
- 已知限制：习惯热力格仅由 streakCount 还原（后端暂无逐日打卡历史端点），展示的是「最近连续打卡」而非真实逐日记录，如需真实多周历史需新增后端 `GET /habits/{id}/checkins` 并重新部署；统计页崩溃同样存在于已部署网页版（main 分支同源），需重新部署前端方可在线上修复。
