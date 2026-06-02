# Chronos 部署与发布基线

## Linux 云服务器部署

本轮使用 Docker Compose 手动部署 Spring Boot API 与 MySQL。服务器需要安装
Git、Docker Engine 和 Docker Compose 插件。

```bash
git clone https://github.com/Vincent-Ctrl-18/Chronos.git
cd Chronos
cp .env.example .env
```

编辑 `.env`，至少替换 MySQL root 密码、MySQL 应用密码和 JWT 密钥。随后启动：

```bash
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8080/api/health
```

查看日志与更新版本：

```bash
docker compose logs -f api
git pull --ff-only
docker compose up -d --build
```

MySQL 数据保存在 `chronos-mysql-data` volume。`database/mysql/schema.sql` 只会在
首次初始化数据库 volume 时执行；后续结构升级由 `M1-02` 的 Flyway 任务接管。

## Windows 安装包

GitHub Actions 中的 `Windows Installer` workflow 仅手动触发。它上传：

- `chronos-windows-installer`：Windows `.exe` 安装包。
- `chronos-server-jar`：可用于排查问题的 Spring Boot Jar。

PR 不构建安装包，但每个 PR 必须通过 `frontend-check`、`backend-test` 和
`mysql-smoke`。

## 安全边界

公网 HTTP 仅用于临时课程演示。HTTPS 完成前：

- 不允许通过公网 HTTP 提交用户自带 AI Key。
- 只能使用服务端环境变量中的演示 Key。
- 不把 `.env`、真实数据库密码或第三方 API Key 提交到 Git。

PWA 不属于本轮交付物。桌面端运行时 API 地址配置由 `M1-05` 任务实现。
