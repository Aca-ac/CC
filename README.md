# Chronos 智能任务管理系统

Chronos 是面向学生和自我提升人群的智能学习任务管理系统。当前仓库是“开发引导型脚手架”：它提供前端、后端、数据库和文档的基础结构，帮助团队按既有需求资料继续开发，不在初始版本中实现完整业务逻辑。

## 项目定位

- 核心工具能力：学习项目、任务管理、今日看板、本地持久化、基础统计和同步提示。
- AI 增强能力：目标拆解、任务树预览、阶段复盘和优化建议，必须以草稿方式展示，用户确认后才落库。
- 工程边界：当前不引入 Redis、RabbitMQ、K8s、真实 LLM 调用或复杂冲突合并算法，先保证课程项目能按 P0/P1 目标推进。

## 目录结构

```text
.
├── client/                  # Electron + React + Vite 前端框架
├── server/                  # Spring Boot 后端框架
├── database/
│   ├── mysql/schema.sql     # 云端 MySQL 建表草案
│   └── sqlite/schema.sql    # 历史本地 SQLite 设计草案
├── docs/                    # 架构、接口、数据库和开发指南
├── .github/workflows/ci.yml # 持续集成检查入口
├── compose.yml              # Linux 云服务器 Docker Compose 入口
├── .env.example             # 环境变量模板
└── record.md                # 每次改动记录
```

## 开发环境

- Node.js 20 LTS 或更高版本。
- npm 10 或更高版本。
- JDK 17 或更高版本。
- MySQL 8.0 或更高版本。
- Git。

本仓库使用 npm workspace 管理前端；后端使用 `server/mvnw.cmd` 或 `server/mvnw` 下载并运行 Maven，因此本机无需提前安装 Maven。

## 数据库配置

后端默认连接本地 MySQL。启动前需要：

1. **创建数据库**（如果尚未创建）：

   ```sql
   CREATE DATABASE chronos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **导入表结构**：

   ```powershell
   mysql -u root -p chronos < database\mysql\schema.sql
   ```

3. **配置环境变量**，将 `.env.example` 复制为 `.env` 并填写数据库密码：

   ```powershell
   copy .env.example .env
   ```

   然后编辑 `.env` 中的以下字段：

   ```env
   DB_URL=jdbc:mysql://localhost:3306/chronos?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
   DB_USERNAME=root
   DB_PASSWORD=你的数据库密码
   ```

   也可以在 IDE 的 Run Configuration 或系统环境变量中设置 `DB_PASSWORD`，不写入文件。

## 快速启动

```powershell
# 安装前端依赖
npm install

# 启动前端 Web 开发服务器
npm run dev --workspace client

# 启动 Electron 桌面壳
npm run electron:dev --workspace client

# 运行后端测试
.\server\mvnw.cmd test

# 启动后端服务（需先完成数据库配置）
.\server\mvnw.cmd spring-boot:run
```

## 开发路线

1. 前端先补齐页面交互：今日看板、项目、任务、日历、AI 拆解、统计、设置。
2. 后端先实现认证、项目、任务和健康检查接口，再逐步接入统计、同步和 AI 草稿接口。
3. 桌面端按本轮交付计划使用 IndexedDB + outbox；云端使用 MySQL，并根据实体和接口演进补 Flyway 迁移。
4. 每次变更都更新 `record.md`，记录文件范围、目的和验证结果。

## 部署与制品

- Linux 云服务器克隆仓库后，通过 `docker compose up -d --build` 启动 API 与 MySQL。
- 每个 PR 必须通过前端构建、后端测试和 MySQL 冒烟检查。
- Windows `.exe` 安装包通过 GitHub Actions 中的 `Windows Installer` workflow 手动生成。

更多说明见 `docs/architecture.md`、`docs/api.md`、`docs/database.md`、`docs/development-guide.md` 和 `docs/deployment.md`。
