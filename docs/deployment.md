# Chronos 部署与 GitHub Actions CD

目标地址：`https://vincentt.xyz/chronos/`

本项目按子路径部署，避免影响服务器上已有的 ByteDance 根站和 `/party/` 项目：

- 代码目录：`/var/www/chronos`
- Docker Compose project：`chronos`
- 后端容器内部端口：`8080`
- 后端宿主机端口：`8782`
- 前端静态目录：`/var/www/chronos/client/dist`
- Nginx 子路径：`/chronos/`
- API 子路径：`/chronos/api/` 转发到 `http://127.0.0.1:8782/api/`

## 1. 服务器准备

以下命令在服务器执行，`deploy` 用户可以替换为你现在用于 ByteDance/party 的部署用户。

```bash
sudo apt-get update
sudo apt-get install -y git curl nginx docker.io docker-compose-plugin

sudo useradd -m -s /bin/bash deploy || true
sudo usermod -aG docker deploy

sudo mkdir -p /var/www/chronos
sudo chown -R deploy:deploy /var/www/chronos
```

如果 GitHub Actions 需要自动 reload nginx，需要给部署用户精确授权：

```bash
echo 'deploy ALL=(root) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /usr/bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/chronos-deploy
sudo chmod 440 /etc/sudoers.d/chronos-deploy
```

## 2. 配置服务器读取 GitHub 仓库

GitHub 已经不支持 HTTPS 密码拉取代码。私有仓库建议给服务器上的 `deploy` 用户配置一个只读 GitHub Deploy Key。

在服务器执行：

```bash
sudo -iu deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "chronos-server-repo-read" -f ~/.ssh/chronos_repo_deploy -N ""
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
cat ~/.ssh/chronos_repo_deploy.pub
```

把上面输出的公钥加到 GitHub 仓库 Deploy keys：

```bash
gh repo deploy-key add <public-key-file> -R Vincent-Ctrl-18/Chronos -t "chronos-server-repo-read"
```

也可以在网页里添加：`Chronos` 仓库 -> Settings -> Deploy keys -> Add deploy key。不要勾选写权限。

然后在服务器上给 `deploy` 用户配置 SSH 使用这把 key：

```bash
sudo -iu deploy
cat > ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/chronos_repo_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

`ssh -T` 如果显示已认证但 GitHub 不提供 shell access，说明 key 可用。

首次拉取代码：

```bash
sudo -u deploy git clone git@github.com:Vincent-Ctrl-18/Chronos.git /var/www/chronos
cd /var/www/chronos
sudo -u deploy cp .env.example .env
```

编辑 `/var/www/chronos/.env`，至少使用下面这些生产值：

```bash
VITE_APP_BASE=/chronos/
VITE_API_BASE_URL=/chronos/api

SERVER_PORT=8080
CHRONOS_API_PORT=8782

CHRONOS_MYSQL_DATABASE=chronos
CHRONOS_MYSQL_USERNAME=chronos
CHRONOS_MYSQL_PASSWORD=<replace-with-random-password>
CHRONOS_MYSQL_ROOT_PASSWORD=<replace-with-random-root-password>
CHRONOS_JWT_SECRET=<replace-with-long-random-secret>

CHRONOS_AI_PROVIDER=mock
CHRONOS_AI_API_KEY=
```

## 3. Nginx 子路径配置

把 `deploy/nginx-chronos.conf` 里的三个 `location` block 放到现有 `vincentt.xyz` server block 中，并且放在根站 `location /` 之前。

可用命令示例：

```bash
sudo cp /var/www/chronos/deploy/nginx-chronos.conf /etc/nginx/snippets/chronos.conf
sudo nano /etc/nginx/sites-available/vincentt.xyz
# 在 server { ... } 内添加：
# include /etc/nginx/snippets/chronos.conf;

sudo nginx -t
sudo systemctl reload nginx
```

## 4. 配置 GitHub Actions 登录服务器

这把 key 用于 GitHub Actions SSH 登录服务器，和上面的 GitHub Deploy Key 不是同一把。下面命令在本机执行：

```bash
ssh-keygen -t ed25519 -C "chronos-github-actions" -f ~/.ssh/chronos_github_actions -N ""
ssh-copy-id -i ~/.ssh/chronos_github_actions.pub -p <ssh-port> deploy@<server-host>
```

在仓库根目录用 GitHub CLI 配置 secrets：

```bash
gh secret set DEPLOY_HOST --body "<server-host>"
gh secret set DEPLOY_PORT --body "<ssh-port>"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_PATH --body "/var/www/chronos"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/chronos_github_actions
```

检查 secrets：

```bash
gh secret list
```

## 5. CD 触发规则

`.github/workflows/deploy.yml` 只监听：

```yaml
pull_request:
  branches: [main]
  types: [closed]
```

并且 job 级别限制：

```yaml
if: github.event.pull_request.merged == true
```

因此只有 PR 被 merge 到 `main` 后才会自动部署；直接 push、关闭但未合并的 PR 都不会部署。

## 6. 手动验证

服务器上可手动执行一次：

```bash
cd /var/www/chronos
npm ci
VITE_APP_BASE=/chronos/ VITE_API_BASE_URL=/chronos/api npm run build --workspace client
docker compose --env-file .env -p chronos up -d --build
curl -fsS http://127.0.0.1:8782/api/health
sudo nginx -t
sudo systemctl reload nginx
```

浏览器检查：

```bash
curl -I https://vincentt.xyz/chronos/
curl -fsS https://vincentt.xyz/chronos/api/health
```
