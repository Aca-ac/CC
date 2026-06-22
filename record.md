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

## 2026-06-20 收尾阶段 4b（质感/动效打磨 + 发布修复）

- 改动文件：`client/src/styles/global.css`（阴影 token 改为经 `--elevation-1/2` 间接引用、随主题切换，深色加顶边高光，使卡片有「浮起」质感；新增 `.markdown-compact` 紧凑 Markdown 变体）、`client/src/components/ui/PageHeader.tsx`（eyebrow 改为「靛蓝竖条 + 文案」，去掉对中文不友好的 `uppercase`/宽字距）、`client/src/components/ui/StatCard.tsx`（悬停轻微上移微交互）、`client/src/pages/DashboardPage.tsx`（AI 每周建议改用 `MarkdownView` 渲染、去掉问候语 emoji）、`client/package.json`（`dist:win` 增加 `--publish never`，修复 v1.0.1 发布构建因 electron-builder 检测 tag 触发隐式 GitHub 发布、缺 `GH_TOKEN` 而失败的问题；发布仍由工作流的 `gh release create` 完成）。
- 改动目的：按用户反馈把产品进一步打磨——布局质感（阴影/层次）、动效微交互、Markdown 渲染、减少 emoji；并修复 v1.0.1 桌面发布失败。
- 验证结果：`npm run build`（client）通过；`npx vitest run` 全绿（25 文件 / 68 测试）；Playwright 实机截图核对深/浅主题卡片质感与 eyebrow 竖条。
- 待办：用户反馈的「部分页面文字重复」（候选：空列表页 header 与空状态各有一个「新建X」按钮）待确认具体页面后再改；网页版同源的统计页崩溃仍需重新部署前端才能在线修复。

## 2026-06-20 收尾阶段 5（青蓝主题 + 多项功能完善）

- 改动文件：
  - 主题/质感/动效（#1）：`client/src/styles/global.css`（主色由靛蓝改为青蓝 cyan/teal，新增蓝→青渐变端点 `--grad-from/to`、`--on-accent` 前景色、随主色的 `--accent-shadow` 投影；新增缓慢漂浮的青蓝氛围背景 `.app-aurora` + keyframes，遵循 reduced-motion）、`client/src/components/AppLayout.tsx`（接入 aurora、品牌/选中态改用渐变与 `--on-accent`、主区域加宽至 1320px 并收紧留白）、`client/src/components/ui/Button.tsx`（主按钮投影/前景跟随主题）。
  - 日历小时时间轴 + 前后切换（#2）：`client/src/pages/CalendarPage.tsx`（周视图改为小时级时间轴：星期表头吸顶、按小时铺排任务、优先级色条；新增锚点日期 + 上一周/下一周（月视图为上/下月）+「今天」导航；修复右上「导入项目」下拉被裁剪：限定 40 宽、补足箭头空间，文案改「选择项目…」）。
  - 设置精简 + 自定义模型名 + 退出登录（#3）：后端 `ai_settings` 增 `model` 列（`entity/AiSettings`、`UpdateAiSettingsRequest`/`AiSettingsResponse` 增字段并保留向后兼容构造器、`AiSettingsService` 落库/读取/`getModel`、`AiProviderFactory.resolveModel` 用户模型优先回落默认、`database/mysql/schema.sql` + `schema-test.sql` 加列、`SyncSchemaInitializer` 幂等 `ALTER TABLE ai_settings ADD COLUMN model` 兼容旧库）；前端 `apiClient` 类型加 `model`，`SettingsPage` 大幅精简（移除服务 API 地址卡片与静态同步策略卡片，新增账号卡片 + 退出登录，AI 卡片加模型名输入，文案口语化）。
  - 静默自动同步（#4）：`client/src/hooks/useSync.ts`（已登录且在线时自动同步：挂载即同步、本地写入即时推送（去抖）、网络恢复补同步、20s 心跳回拉）、`client/src/storage/repositories/outboxRepository.ts`（入队广播 `chronos:outbox-changed`）、`client/src/components/SyncStatusChip.tsx`（改读 auth，登录非离线时启用自动同步，仍可点击手动）。
  - 习惯打卡持久化 + 庆祝弹窗（#5）：`client/src/hooks/useHabits.ts`（「今日已打卡」按日期+习惯 id 持久化到 localStorage，跨天失效，切页返回不再丢失；checkin 返回最新连续天数）、`client/src/pages/HabitsPage.tsx`（打卡成功弹出带勾选光环 + 连续天数的庆祝动画）。
  - AI 拆解含截止时间 + 进度不丢失（#6）：后端 `BreakdownCommitRequest.CommitTaskNode` 增 `dueTime`（保留向后兼容构造器）、`AiService.createTaskTree` 写入 `dueTime`；前端 `apiClient.CommitTaskNode` 加 `dueTime`，`AiBreakdownPage` 草稿新增可编辑截止日期（默认按阶段在周期内铺排）、整页草稿持久化到 sessionStorage（切页返回不丢失，确认/放弃后清除）。
  - 文案去废话（#7）：`AiBreakdownPage`/`ProjectsPage`/`TasksPage`/`LearningLogsPage`/`SettingsPage` 移除「IndexedDB / outbox / 落库 / 内置 Mock / 同步冲突」等实现细节文案，改为面向用户的说明。
  - 登录界面重做（#8）：`client/src/pages/{LoginPage,RegisterPage}.tsx`（青蓝渐变品牌侧 + 表单侧的分栏布局、aurora 背景，去掉硬编码靛蓝阴影；保留离线守卫与各 aria-label/必需文案以兼容测试）。
  - NSIS 安装包修复（#9）：`client/package.json` 移除全局 `artifactName`，改为 `nsis` 与 `portable` 各自命名（`Chronos-Setup-` / `Chronos-Portable-`），消除两个 target 同名覆盖、确保 release 内含真正的 NSIS 安装包且自动更新（latest.yml）可用。
- 改动目的：按用户本轮 9 项要求完善前端设计与多项功能，并修复 release 缺少 NSIS 安装包的问题。
- 验证结果：前端 `npm run build --workspace client` 通过；`cd client && npx vitest run` 全绿（25 文件 / 68 测试）；后端 `.\server\mvnw.cmd test` 全绿（67 测试 0 失败，含 AiSettings 8 / AiBreakdown 6 / AiProvider 8）；Playwright 实机核对日历周视图深/浅主题（青蓝主题、今日列高亮、优先级色条、导入下拉不再裁剪、前后切换可用）。
- 判断与待办：「账号注销」按口语习惯实现为「退出登录」（非删除账号）；自定义模型名落库需线上库迁移，已用启动幂等 `ALTER` 自动补列，无需手工 SQL；按用户要求移除设置页「服务 API 地址」展示（地址仍可经构建环境变量/本地存储配置）；`#9` 仅改打包配置，真正出包需重新发布版本（打 tag）由用户确认后进行；网页版需经 CD（合并到 main）部署方可在线生效。

## 2026-06-20 收尾阶段 5b（注销账号 + 2.0.0 发布）

- 改动文件：`server/.../auth/{AuthController,AuthService}.java`（新增 `DELETE /api/auth/account`：按外键依赖顺序硬删除当前用户的习惯/打卡/AI 建议/AI 设置/专注记录/学习日志/任务/同步记录/项目，最后删 users 并 `StpUtil.logout()`；任务自引用先置空 parent_task_id 再删）、`server/.../auth/AuthServiceTests.java`（新增：播种用户 A 全量数据 + 用户 B 项目，注销后断言 A 数据全清、B 保留）、`client/src/services/apiClient.ts`（`deleteAccount()`）、`client/src/pages/SettingsPage.tsx`（账号卡片新增「注销账号」危险操作 + 二次确认弹窗，需输入「注销」；成功后清本地 IndexedDB 与缓存并退出登录）、`client/package.json`（版本 1.0.1 → 2.0.0，`__APP_VERSION__` 随之更新）。
- 改动目的：按用户要求把「注销」实现为永久删除账号及全部数据（区别于「退出登录」）；并将本轮全部改动作为 2.0.0 发布。
- 验证结果：前端 `npm run build --workspace client` 通过；后端 `AuthServiceTests` 通过（1/0/0）。
- 发布：提交 PR 至 main（用户负责合并 → 触发 CD 部署网页版），推送 `v2.0.0` tag 触发 `windows-installer.yml` 出包并 `gh release create`（含修好命名后的 NSIS 安装包 + latest.yml）。

## 2026-06-20 收尾阶段 6（桌面自托管自动更新 + 友好报错）

- 背景：仓库为私有，GitHub Release 及资产需鉴权，electron-updater 匿名读取 `releases.atom` 得 404，桌面端「检查更新」报原始 HttpError。GitHub 不支持单独公开 Release（可见性跟随仓库）。
- 改动文件：`client/electron/main.ts`（新增 `friendlyUpdateError`，`checkNativeUpdate`/`downloadNativeUpdate` 包裹 try/catch 并以友好状态返回，`error` 事件用友好文案，避免把网络错误堆栈抛到界面）、`client/package.json`（`build.publish` 由 github 改为 generic 自托管源 `https://vincentt.xyz/chronos/updates/`；版本 2.0.0 → 2.0.1）、`.github/workflows/windows-installer.yml`（构建后新增「Publish update feed to server」步骤：复用现有 DEPLOY_* SSH 密钥，scp `latest.yml + Chronos-Setup-*.exe + .blockmap` 到服务器 `/var/www/chronos-updates`）、`deploy/nginx-chronos.conf`（新增 `location /chronos/updates/` → alias `/var/www/chronos-updates/`，no-cache）。
- 改动目的：在保持源码私有的前提下让桌面端自动更新可用——更新源自托管到用户服务器，应用改用 generic provider 拉取。
- 验证结果：`npm run build --workspace client` 通过；workflow YAML 通过 `yaml.safe_load` 校验。
- 服务器准备（需用户一次性执行）：`sudo mkdir -p /var/www/chronos-updates && sudo chown -R <DEPLOY_USER>:<DEPLOY_USER> /var/www/chronos-updates`；nginx 加 `/chronos/updates/` location 后 `nginx -t && systemctl reload nginx`。
- 限制（引导问题）：当前已安装的 v2.0.0/v1.0.1 仍指向旧 GitHub 源，无法自动升到 2.0.1，需手动安装一次 2.0.1；此后 2.0.2+ 才会从自托管源自动更新。

## 2026-06-21 收尾阶段 7（深色/头像/AI/计时器/排序/统计/标题 9 项打磨）

- 与「收尾阶段 6」同分支（vincent/desktop-update-selfhost），随 2.0.1 一并发布。
- 改动文件：
  - 深色模式黑灰化（#1）：`client/src/styles/global.css`（`.dark` 面板/文字/描边改中性黑灰，强调色收敛为低调青并大幅降低投影；深色下禁用 `.app-aurora` 氛围光，消除蓝色光晕）。
  - 侧栏头像贴合 + 悬停账号弹窗（#2）：`client/src/components/AppLayout.tsx`（新增 `SidebarUser`：渐变首字母圆形头像贴合窄栏；悬停/聚焦弹出账号信息卡，含「切换账号」「退出登录」）。
  - AI 模型分工 + 每周建议每日缓存（#3）：`AiProviderFactory` 新增 `getBreakdownProvider`(pro)/`getAdviceProvider`(flash) 与 `breakdown-model/advice-model/breakdown-reasoning` 配置；`ChatCompletionRequest` 增 `reasoningEffort`（保留 5 参兼容构造器），`DeepSeekProvider` 透传 `reasoning_effort`；`AiService.previewBreakdownTree` 用 pro+high，`generateWeeklyAdvice` 用 flash 且当天已生成则返回缓存（不再每次进看板重复调用）；`application.yml` 增对应配置。
  - 拆解截止日期优化（#4）：`AiBreakdownPage`（`taskDueDate` 把任务分散到各阶段时间窗内、避免同日堆积；提交时间由 23:59 改 20:00）；`AiService` 拆解 prompt 强调循序渐进、时间分散、合理时长。
  - 删除多余文案（#5）：`AiBreakdownPage` 去掉「目标项目」字段的 hint，恢复与「计划周期」对称。
  - 专注计时器美化（#6）：`LearningLogsPage` 活跃计时改为居中专注光环（呼吸脉冲环 + 渐变计时数字 + 闪烁「专注中」）。
  - 任务排序 + 完成对号动画（#7）：`useTasks` 排序改为先按截止时间、再按先后顺序（AI 拆解顺序经分散的截止日期体现）；`TasksPage` 新增醒目 `TaskCheck`（空心圆/实心对号，完成时弹性对号 + 扩散光环），完成标题加删除线。
  - 完成度/统计修复（#8）：`ProjectsPage` 项目完成度改按真实任务（已完成/未归档总数）计算、无任务回落手填进度，平均进度同源；`StatsService` 项目分布的 total/completed 改按全部任务（投入时长仍按本周）；`StatsPage` 时间分布只展示本周有时长的项目、项目进度只展示有任务的项目。
  - 页面标题去重复（#9）：`PageHeader` 标题前置渐变竖条；各页移除 eyebrow 小标签，仅保留单一标题；项目页标题与导航统一为「项目管理」。
- 改动目的：按用户本轮 9 项要求做深色配色、账号交互、AI 模型分工与省 token、拆解日期合理化、计时器观感、任务排序与完成反馈、统计正确性、标题去冗余等打磨。
- 验证结果：前端 `npm run build --workspace client` 通过；`cd client && npx vitest run` 全绿（25 文件 / 68 测试）；后端 `.\server\mvnw.cmd test` 68 测试中仅 `MySqlSaTokenDaoTests.treatsExpiredTokenAsMissing` 偶发失败（H2 MySQL 模式 TIMESTAMP 对 timeout=0 的秒级四舍五入边界，单独重跑 2/2 通过），与本轮改动无关。
- 判断与待办：模型名（deepseek-v4-pro/flash）与 (high) 推理强度为可配置项，无 Key 时仍回落 Mock；每周建议改为后端当天缓存（前端仍只在进入看板时请求）；任务「AI 拆解顺序」未在后端持久化 orderIndex，靠递增的截止日期体现先后。

## 2026-06-21 收尾阶段 8（计时器暂停/AI解析/日历筛选/侧栏/删除/宋体 8 项修复）

- 新分支 `fix/ui-batch-8`（基于 origin/main 的已发布 2.0.1 代码），随下个版本一并发布。
- 改动文件：
  - 专注计时器暂停 + 动画优化（#1）：`client/src/hooks/useTimer.ts` 新增 `paused` 状态与 `pauseTimer/resumeTimer`（用 `baseSecondsRef` 累计已计秒数，可暂停恢复，不影响服务端恢复逻辑）；`client/src/components/icons/index.tsx` 新增 `IconPause`/`IconPlay`；`LearningLogsPage` 活跃计时改为运行时缓慢旋转渐变弧 + 呼吸脉冲，暂停时静止收敛并显示「已暂停」，新增「暂停/继续」按钮。
  - AI 拆解全面修复（#2）：`AiService` 拆解 prompt 重写（阶段数匹配周数、动词开头、时长分布、禁止 Markdown 代码块、仅输出合法 JSON），`max_tokens` 2048→4096 避免截断；新增 `extractJsonObject`（剥离 ``` 围栏、截取首个`{`到末个`}`）并在解析前调用；解析失败/无 stages 时降级为可读提示而非把原始 JSON 塞进任务标题。
  - 日历按项目筛选 + 不筛选选项（#3）：`CalendarPage` 新增 `filterProjectId` 与「全部项目」下拉，`visibleTasks` 按项目过滤后再排周/月格；原「选择项目…」（实为导入目标）改名「导入到…」消除歧义。
  - 去掉侧栏顶部「C」图标（#4）：`AppLayout` 移除渐变「C」方块，仅展开/抽屉态展示「Chronos」文字标识，窄栏顶部留白。
  - 项目删除后刷新复活修复（#5）：`useProjects.refresh`/`useTasks.refresh` 在用服务端列表覆盖本地前，跳过 outbox 中仍待同步的 DELETE 项（按 entityId 过滤），避免被服务端「复活」。
  - 日历任务卡按优先级着色（#6）：`CalendarPage` 新增 `priorityCardStyle`（左侧色条 + 同色淡底），周/月视图任务卡均按 LOW/MEDIUM/HIGH/URGENT 着色。
  - 侧栏图标动画（#7）：`AppLayout` 导航图标包 `motion.span`，hover 放大微旋、点击回弹，选中时弹性脉冲。
  - 看板小卡片留白 + 宋体数字（#8）：`StatCard` 改为 `justify-between`（图标+标签在左、大号宋体数字靠右填满留白）；新增 `--font-serif`（宋体系）；日历/记录页指标卡数字统一 `font-serif tabular-nums`。
- 改动目的：按用户本轮 8 项要求修复计时器交互、AI 拆解解析鲁棒性、日历筛选与配色、侧栏精简与动效、删除持久化、统计数字视觉。
- 验证结果：前端 `tsc -p tsconfig.app.json` 与 `vite build` 通过（`tsc -p electron/tsconfig.json` 因本地未装 electron-updater 报错，属既有环境缺口、与本轮无关）；`npx vitest run` 全绿（25 文件 / 68 测试，含 `useTimer.test.ts` 6 项）；后端 `mvnw test` BUILD SUCCESS（含上轮偶发的 `MySqlSaTokenDaoTests` 本次亦通过）。
- 判断与待办：计时器暂停为本地态（重开应用按服务端 startTime 续算，不持久化暂停区间）；AI 拆解解析鲁棒性已加固，仍依赖模型基本遵循 JSON 指令；删除复活修复同时覆盖项目与任务。

## 2026-06-21 桌面自动更新可靠性（差量优先 + 整包兜底 + 更新动画）

- 分支 `fix/desktop-update-reliability`，bump 客户端到 **2.0.3**。
- 背景：用户反馈桌面端「很多次检查不到新版本，下载后卡在 0% 无响应」。排查：服务端 feed 稳定（latest.yml=2.0.2、安装包 size/sha512 一致、blockmap 齐全、单/多 range 均 206、multipart/byteranges 正常），即差量下载服务端完全可用；卡 0% 多为代理（用户 198.18.x Clash 出口）无法正确处理 multipart/byteranges 流。检测时断时续主要来自发布上传窗口（旧顺序先传 latest.yml 后传 106MB 安装包，期间 feed 已指向尚未上传完的包）。
- 改动文件：
  - `client/electron/main.ts`：保留差量下载为默认（省带宽），新增「看门狗」——`downloadUpdate` 后 25s 内若零进度，取消差量（`cancellationToken.cancel()`）、置 `disableDifferentialDownload=true` 重新整包下载兜底；每次检查恢复差量优先并记录 `pendingCheck` 以持有 cancellationToken。
  - `client/src/pages/SettingsPage.tsx`：更新卡片动画打磨——下载态改为渐变进度条（>0% 平滑增长、0%/准备态用来回扫光的不确定进度条，避免「卡住」错觉），各状态用 `AnimatePresence` 切换并配动效图标（检查中旋转、发现新版本脉冲、完成弹性对号、错误告警）。
  - `.github/workflows/windows-installer.yml`：发布上传改为「先传安装包 + blockmap，最后单独传 latest.yml」，保证 feed 只在二进制完整可下载后才生效，消除「检测到新版本却下载 404/卡住」的窗口。
  - `client/package.json`：2.0.2 → 2.0.3。
- 改动目的：在保留差量下载（减轻服务器压力）的前提下，根治下载卡 0%（代理不兼容 multipart 时整包兜底），并消除发布窗口导致的检测/下载不稳定；同时打磨更新交互动画。
- 验证结果：app `tsc -p tsconfig.app.json` 通过；`npx vitest run` 见提交说明（main.ts 属 electron，本地无 electron-updater 不参与 app typecheck，CI `npm ci` 覆盖）。
- 判断与待办：看门狗回退仅对「装有此版本(≥2.0.3)的客户端发起的下载」生效——当前卡住的旧版本需手动安装一次 2.0.3 安装包打破循环；之后差量优先 + 整包兜底自动生效。

## 2026-06-22 收尾阶段（卡片数字/侧栏居中/计时器楷体滚动/删除根因/看板数据 5 项修复）

- 分支 `fix/desktop-update-reliability`（续接上轮，随下个版本一并发布），bump 客户端到 **2.0.4**。
- 改动文件：
  - 卡片数字观感修复（#1）：`client/src/components/ui/StatCard.tsx` 大号数字加 `lining-nums`（修 Georgia 旧式数字纵向被压缩），量词（suffix）移出衬线 span、用默认无衬线小字呈现并与数字基线对齐，突出「数据本体」。
  - 侧栏图标整体居中（#2）：`AppLayout` 导航在窄栏（收起态）下 `flex-1 justify-center` 垂直居中；选中胶囊收起态由靠左改为 `left-1/2 -translate-x-1/2` 水平居中。
  - 专注计时器重做（#3）：`LearningLogsPage` 新增 `RollingDigit`/`RollingTime`（0-9 纵向滚动翻牌的时间数字）；活跃计时背景由旋转弧/脉冲环改为两团漂浮柔光气团（focus/accent，缓慢漂移呼吸，暂停时收敛调暗）；时间改用楷体（新增 `--font-kai` 字族）+ 柔光，保留「专注中/已暂停」状态与暂停/继续/停止/丢弃按钮。
  - 项目删除复活根因修复（#4）：`server/.../sync/SyncService.java` 三处 DELETE 由 `setDeletedAt()+updateById()` 改为 `deleteById()`——`@TableLogic` 字段在 `updateById` 时被忽略，旧写法根本没软删（刷新即「复活」）；项目 DELETE 级联软删其任务与学习日志。`client/src/hooks/useProjects.ts` 删除项目时本地级联软删 + 入队该项目下所有任务的 TASK DELETE，避免任务残留。
  - 看板数据显示修复（#5）：`server/.../dashboard/DashboardService.java` 累计完成改为全部 DONE（去掉按今日 updatedAt 过滤），专注时长改按 `userId` 直接统计专注会话（旧的 task→project 关联会漏掉未关联任务的专注，导致恒为 0）；`client/src/hooks/useDashboard.ts` 在线分支改为「先 loadLocal、最后用服务端权威统计覆盖」（移除会清掉服务端 summary 的 finally-loadLocal），并跳过待同步 DELETE 的任务；`DashboardPage` 专注分钟改为「专注时长」（<60 分显示分钟、≥60 分显示小时保留 1 位），各卡片量词（个/个/小时|分钟/天）。
- 改动目的：按用户本轮 5 项要求修复卡片数字观感与量词、侧栏图标居中、计时器优雅度（楷体滚动 + 柔光背景）、项目删除无效根因、看板专注时长与连续打卡显示。
- 验证结果：app `tsc -p tsconfig.app.json --noEmit` 通过；`npx vitest run` 全绿（25 文件 / 68 测试）；后端 `mvnw --offline compile` 通过。
- 判断与待办：#4 根因为 `@TableLogic` 被 `updateById` 忽略——任何「软删」逻辑都必须走 `deleteById`；连续打卡仍取后端 `habitStreak`（本地 summary 计算缺打卡数据故为 0，在线时由服务端覆盖）。
