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
