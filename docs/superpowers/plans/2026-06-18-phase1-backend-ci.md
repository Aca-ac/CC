# Phase 1: 后端整合 + CI 打底 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把后端 PR #67（番茄钟/统计/学习日志/同步/AI 适配器 + 测试）整合进集成分支，统一 AI 为 OpenAI 兼容 Provider，吸收 PR #61 的前端同步逻辑，并让 CI 真正校验前后端。

**Architecture:** 在集成分支 `codex/finishing`（基于 `origin/main`）上，用一次 `git merge` 把 `origin/feat/m2-learning-timer-stats-ai` 引入并手工解决冲突；以 PR #67 自带的后端测试套件作为回归门禁。随后泛化 AI provider，吸收前端同步逻辑，最后改写 CI workflow。

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / MyBatis-Plus / Sa-Token / JUnit 5；前端 Vite 6 / React 19 / Vitest；GitHub Actions。

## Global Constraints

- Java 版本：17（`server/pom.xml` `<java.version>17`）。
- 后端构建一律用 Maven Wrapper：`./server/mvnw`（Linux/CI）或 `.\server\mvnw.cmd`（Windows 本地）。不假设系统装了 Maven。
- 统一响应包络 `ApiResponse<T>` = `{ success, code, message, data }`；用 `ApiResponse.ok(data)` / `ApiResponse.fail(ErrorCode, msg)`。
- 持久化：MyBatis-Plus，雪花 ID（`id-type: assign_id`，主键 `VARCHAR(64)`），逻辑删除字段 `deletedAt`。
- AI 必须"可关闭、可失败、可替换"：provider 抽象 + BYOK；不可用时核心功能不受影响。默认 provider 为 `mock`。
- 同步沿用触发/定时 REST，基于版本号 + 更新时间检测冲突；不引入 WebSocket/MQ。
- 后端单测必须能在无外部 MySQL 的环境下通过（CI 用测试 schema / H2）。
- 工作分支：`codex/finishing`。推送到 `main` 前需用户确认。
- 提交信息结尾附：`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

---

### Task 1: 合并 PR #67 后端并解决冲突，使后端测试通过

**Files:**
- Merge source: `origin/feat/m2-learning-timer-stats-ai`（48 文件，大量新增 + 8 处冲突）
- Resolve conflicts in:
  - `server/src/main/java/com/chronos/sync/SyncService.java`（新增 vs main 的 SyncController 逻辑）
  - `server/src/main/java/com/chronos/sync/SyncController.java`
  - `server/src/main/java/com/chronos/sync/dto/SyncPushResponse.java`
  - `server/src/main/java/com/chronos/ai/AiController.java`
  - `server/src/main/java/com/chronos/ai/AiService.java`
  - `server/src/main/java/com/chronos/entity/FocusSession.java`
  - `server/src/main/resources/application.yml`
  - `server/pom.xml`
- Test gate (来自 PR #67，合并后即存在):
  - `server/src/test/java/com/chronos/timer/TimerServiceTests.java`
  - `server/src/test/java/com/chronos/stats/StatsServiceTests.java`
  - `server/src/test/java/com/chronos/learninglog/LearningLogServiceTests.java`
  - `server/src/test/java/com/chronos/ai/AiBreakdownServiceTests.java`、`AiAdviceServiceTests.java`、`AiSettingsServiceTests.java`
  - `server/src/test/java/com/chronos/ai/provider/AiProviderTests.java`
  - `server/src/test/resources/application.yml`、`server/src/test/resources/schema-test.sql`

**Interfaces:**
- Consumes: 无（起点任务）。
- Produces:
  - 新后端模块包：`com.chronos.timer`（`TimerController`/`TimerService` + dto）、`com.chronos.stats`（`StatsController`/`StatsService` + `WeeklyStatsResponse`）、`com.chronos.learninglog`（`LearningLogController`/`LearningLogService` + dto）。
  - `com.chronos.ai.AiSettingsService`、`entity/AiSettings`、`mapper/AiSettingsMapper`、`ai/dto/*`。
  - `com.chronos.ai.provider` 包：`AiProvider`（接口）、`AiProviderFactory`、`DeepSeekProvider`、`MiMoProvider`、`MockProvider`、`provider/dto/{ChatCompletionRequest,ChatCompletionResponse,AiProviderException}`。
  - `com.chronos.sync.SyncService`（push/pull/resolve 完整实现）、`sync/dto/{SyncResolveRequest,SyncResolveResponse}`。
  - `entity/FocusSession` 含计时所需字段。

- [ ] **Step 1: 确认在集成分支、工作树干净**

Run:
```bash
git -C /d/practice/SoftwareEngineering rev-parse --abbrev-ref HEAD
git -C /d/practice/SoftwareEngineering status --short
```
Expected: 分支为 `codex/finishing`；除已知无关未跟踪文件外无碍。若有会被合并影响的脏改动，先 `git stash`。

- [ ] **Step 2: 发起合并（预期产生冲突，先不提交）**

Run:
```bash
cd /d/practice/SoftwareEngineering
git merge --no-commit --no-ff origin/feat/m2-learning-timer-stats-ai
git status --short | grep -E "^(UU|AA|U |DU|UD)"
```
Expected: 合并暂停并列出冲突文件（约 8 个，集中在 sync / ai / entity / application.yml / pom.xml）。新增文件（timer/stats/learninglog 等）自动 staged，无冲突。

- [ ] **Step 3: 解决 `server/pom.xml` 冲突（取依赖并集）**

打开 `server/pom.xml`，保留双方依赖：main 现有依赖 + PR #67 新增（如 `spring-boot-starter-webflux` 或 `WebClient`/HTTP 客户端、AI 相关）。删除 `<<<<<<<`/`=======`/`>>>>>>>` 标记，确保 `<dependencies>` 无重复 `groupId+artifactId`。

- [ ] **Step 4: 解决 `application.yml` 冲突（取配置并集）**

合并 `server/src/main/resources/application.yml`：保留 main 的 datasource/mybatis-plus/jackson 配置 + PR #67 的 `chronos.ai.provider`、`chronos.ai.providers.*`（deepseek/mimo endpoint/model）、`chronos.ai.master-key` 等。确保 YAML 缩进正确、键不重复。

- [ ] **Step 5: 解决 `entity/FocusSession.java` 冲突（取字段并集）**

合并字段：保留 main 的字段 + PR #67 为计时新增的字段（如状态/时长/暂停相关）。保持 MyBatis-Plus 注解风格与 `deletedAt` 逻辑删除一致。

- [ ] **Step 6: 解决 `ai/AiController.java` 与 `ai/AiService.java` 冲突**

保留 PR #67 的拆解（breakdown-preview / breakdown commit）、复盘（review-preview）、AI 设置接口与 provider 调度逻辑；合并 main 已有的 AI 接口签名与 `ApiResponse` 包络。确保所有端点仍返回 `ApiResponse<T>`。

- [ ] **Step 7: 解决 `sync/SyncService.java`、`SyncController.java`、`dto/SyncPushResponse.java` 冲突**

以 PR #67 的实现为准（含冲突计数 `conflictTotal`、`syncStatus=CONFLICT` 标记、push/pull/resolve）。`SyncPushResponse` 字段取并集（如 `accepted`/`conflictTotal`）。`SyncController` 暴露 `/api/sync/push`、`/api/sync/pull`、`/api/sync/resolve`，与前端 `apiClient` 约定一致。

- [ ] **Step 8: 确认无残留冲突标记**

Run:
```bash
cd /d/practice/SoftwareEngineering
grep -rn "^<<<<<<<\|^=======\|^>>>>>>>" server/src server/pom.xml || echo "NO_CONFLICT_MARKERS"
```
Expected: 输出 `NO_CONFLICT_MARKERS`。

- [ ] **Step 9: 编译，验证可构建**

Run:
```bash
cd /d/practice/SoftwareEngineering
./server/mvnw -q -DskipTests compile
```
Expected: BUILD SUCCESS。若编译失败，按报错修正冲突解决处（缺失 import、字段名不一致等）。

- [ ] **Step 10: 跑后端测试套件（回归门禁）**

Run:
```bash
cd /d/practice/SoftwareEngineering
./server/mvnw -q test
```
Expected: BUILD SUCCESS，所有测试通过（timer/stats/learninglog/ai/provider 等）。测试用 `src/test/resources/application.yml` + `schema-test.sql`，无需外部 MySQL。若个别用例因合并失配失败，定位到对应 service 修正逻辑直到全绿。

- [ ] **Step 11: 暂存全部已解决文件并提交合并**

Run:
```bash
cd /d/practice/SoftwareEngineering
git add -A server/
git commit -m "$(printf 'feat: merge backend M2 (timer/stats/logs/sync/AI providers)\n\nResolve conflicts in sync, ai, FocusSession, application.yml, pom.xml.\nBackend test suite green.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
Expected: 合并提交创建成功。

---

### Task 2: 泛化 AI 为通用 OpenAI 兼容 Provider

**Files:**
- Create: `server/src/main/java/com/chronos/ai/provider/OpenAiCompatibleProvider.java`
- Modify: `server/src/main/java/com/chronos/ai/provider/AiProviderFactory.java`
- Modify: `server/src/main/resources/application.yml`（新增 `chronos.ai.providers.openai.*`）
- Test: `server/src/test/java/com/chronos/ai/provider/OpenAiCompatibleProviderTest.java`

**Interfaces:**
- Consumes: `AiProvider`（接口，来自 Task 1）、`ChatCompletionRequest`、`ChatCompletionResponse`、`AiProviderException`（来自 Task 1）。`DeepSeekProvider` 已证实使用 `baseUrl + "/v1/chat/completions"` + `setBearerAuth(apiKey)` + `model`。
- Produces:
  - `OpenAiCompatibleProvider(String baseUrl, String model, String apiKey)`，实现 `AiProvider`，POST `baseUrl + "/v1/chat/completions"`，解析 `choices[0].message.content`。
  - `AiProviderFactory.getProvider(userId, providerName)` 支持 `providerName == "openai"`，参数来自 BYOK 设置（`AiSettingsService`）或 `chronos.ai.providers.openai.*` 配置兜底。

- [ ] **Step 1: 写失败测试**

Create `server/src/test/java/com/chronos/ai/provider/OpenAiCompatibleProviderTest.java`：
```java
package com.chronos.ai.provider;

import com.chronos.ai.provider.dto.ChatCompletionRequest;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class OpenAiCompatibleProviderTest {

    @Test
    void buildsChatCompletionsUrlFromBaseUrl() {
        OpenAiCompatibleProvider provider =
            new OpenAiCompatibleProvider("https://api.example.com", "gpt-4o-mini", "sk-test");
        // 暴露用于断言的受保护/包级方法 endpoint()
        assertNotNull(provider);
        org.junit.jupiter.api.Assertions.assertEquals(
            "https://api.example.com/v1/chat/completions", provider.endpoint());
    }

    @Test
    void implementsAiProvider() {
        AiProvider p = new OpenAiCompatibleProvider("https://api.example.com", "m", "k");
        assertNotNull(p);
    }
}
```

- [ ] **Step 2: 运行测试，确认失败**

Run:
```bash
cd /d/practice/SoftwareEngineering
./server/mvnw -q -Dtest=OpenAiCompatibleProviderTest test
```
Expected: 编译失败 / FAIL —— `OpenAiCompatibleProvider` 不存在。

- [ ] **Step 3: 实现 `OpenAiCompatibleProvider`**

参照 `DeepSeekProvider`（同一 OpenAI 协议）实现 `server/src/main/java/com/chronos/ai/provider/OpenAiCompatibleProvider.java`：构造参数 `(baseUrl, model, apiKey)`；提供包级方法 `String endpoint()` 返回 `baseUrl + "/v1/chat/completions"`；`chat(...)` 用与 `DeepSeekProvider` 相同的请求体（`model` + `messages`）、`setBearerAuth(apiKey)`、解析 `choices[0].message.content`，异常包成 `AiProviderException`。实现 `AiProvider` 接口的全部方法。

- [ ] **Step 4: 在工厂中接入 `openai`**

修改 `AiProviderFactory.getProvider`：在 `switch` 中新增 `case "openai" -> createOpenAiProvider(userId);`，`createOpenAiProvider` 优先用 `AiSettingsService` 中该用户的 BYOK（baseUrl/model/apiKey 解密），缺失时回落到 `chronos.ai.providers.openai.{endpoint,model}` 配置 + 注入的 key。在 `application.yml` 增加：
```yaml
chronos:
  ai:
    providers:
      openai:
        endpoint: ${CHRONOS_AI_OPENAI_ENDPOINT:https://api.openai.com}
        model: ${CHRONOS_AI_OPENAI_MODEL:gpt-4o-mini}
```

- [ ] **Step 5: 运行测试，确认通过**

Run:
```bash
cd /d/practice/SoftwareEngineering
./server/mvnw -q -Dtest=OpenAiCompatibleProviderTest test && ./server/mvnw -q test
```
Expected: 新测试 PASS，且全量 `mvnw test` 仍全绿。

- [ ] **Step 6: 提交**

Run:
```bash
cd /d/practice/SoftwareEngineering
git add server/
git commit -m "$(printf 'feat: add generic OpenAI-compatible AI provider\n\nGeneralize DeepSeek-style /v1/chat/completions into OpenAiCompatibleProvider,\nselectable via provider name \"openai\" and driven by BYOK settings.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
Expected: 提交成功。

---

### Task 3: 吸收 PR #61 的前端同步/存储/冲突逻辑

**Files:**
- Reference (只读取逻辑，不照搬 UI): `origin/feat/m1-05-06-08-09` 的 `client/src/services/syncService.ts`、`client/src/hooks/useSync.ts`、`client/src/hooks/useConflict.ts`、`client/src/storage/repositories/*`、`client/src/storage/db.ts`
- Modify (按需，对齐当前前端): `client/src/services/syncService.ts`、`client/src/hooks/useSync.ts`（如不存在则 Create）、`client/src/storage/repositories/*`
- Test: `client/src/storage/__tests__/*`（沿用并扩展现有）

**Interfaces:**
- Consumes: 现有前端存储层（`getDB`、各 repository、`outboxRepository`）、`apiClient.syncPush/syncPull/resolveConflict`（来自 Task 1 的后端契约）。
- Produces: `useSync()` hook 暴露 `{ status, pending, lastSyncedAt, syncNow() }`；`syncService.push()/pull()/resolve()` 与后端 `/api/sync/*` 对齐。

- [ ] **Step 1: 比对 PR #61 的同步逻辑**

Run:
```bash
cd /d/practice/SoftwareEngineering
git --no-pager diff origin/main origin/feat/m1-05-06-08-09 -- client/src/services/syncService.ts client/src/hooks/useSync.ts client/src/hooks/useConflict.ts | head -300
```
阅读其 push/pull/conflict 处理，挑出比 main 更完整的部分（如 outbox 状态机、冲突落库、重试计数）。

- [ ] **Step 2: 写/更新失败测试**

在 `client/src/storage/__tests__/outbox.test.ts`（或新增 `syncService.test.ts`）补一条断言：push 成功后 outbox 项状态从 `pending` → `synced`；push 返回冲突时该项 → `conflict` 且写入 `conflicts` 仓储。用现有 `fake-indexeddb` setup。

- [ ] **Step 3: 运行测试，确认失败**

Run:
```bash
cd /d/practice/SoftwareEngineering/client
npx vitest run src/storage/__tests__/outbox.test.ts
```
Expected: 新断言 FAIL。

- [ ] **Step 4: 把 PR #61 的同步逻辑整合进现有 service/hook**

将挑选出的逻辑落到 `client/src/services/syncService.ts` 与 `client/src/hooks/useSync.ts`，保持当前前端的类型（`OutboxValue`、`ConflictValue` 等 from `storage/db.ts`）和 `apiClient` 签名。不引入 PR #61 的页面/样式改动。

- [ ] **Step 5: 运行测试，确认通过**

Run:
```bash
cd /d/practice/SoftwareEngineering/client
npx vitest run
```
Expected: 全部 PASS。

- [ ] **Step 6: 提交**

Run:
```bash
cd /d/practice/SoftwareEngineering
git add client/
git commit -m "$(printf 'feat: adopt sync/outbox/conflict logic from PR #61 (logic only)\n\nIntegrate the stronger sync state machine and conflict persistence\nwithout the competing UI rewrite.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
Expected: 提交成功。

---

### Task 4: 修复 CI，让前后端检查真正运行

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1 引入的 `server/src/test/resources/{application.yml,schema-test.sql}`；前端 `vitest`。
- Produces: CI 三个 job 全部启用并通过：`frontend-check`（build + typecheck + vitest）、`backend-test`（`mvnw verify` + 覆盖率）、`mysql-smoke`（health 探活）。

- [ ] **Step 1: 移除后端 job 的禁用门**

编辑 `.github/workflows/ci.yml`，删除 `backend-test` 与 `mysql-smoke` 上的 `if: false  # TODO...` 行。

- [ ] **Step 2: 前端 job 增加 typecheck + 测试**

在 `frontend-check` 的 `Install dependencies` 之后、`build` 之前/之后增加步骤：
```yaml
      - name: Typecheck client
        run: npx tsc -p client/tsconfig.app.json --noEmit
      - name: Test client
        run: npx vitest run --root client
```
（保留现有 `npm run build --workspace client`。）

- [ ] **Step 3: 校验 backend-test 使用测试 schema**

确认 `backend-test` job 的 `mvnw verify` 在 CI 上用 `src/test/resources` 的测试配置即可通过；若 PR #67 的测试用容器 MySQL，则保留 services.mysql 与 `Initialize database` 步骤；若用 H2/内嵌则移除对 MySQL service 的依赖。以 Task 1 中本地 `mvnw test` 的实际依赖为准。

- [ ] **Step 4: 本地静态校验 workflow YAML**

Run:
```bash
cd /d/practice/SoftwareEngineering
python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml',encoding='utf-8')); print('YAML_OK')"
```
Expected: 输出 `YAML_OK`（无语法错误）。

- [ ] **Step 5: 提交**

Run:
```bash
cd /d/practice/SoftwareEngineering
git add .github/workflows/ci.yml
git commit -m "$(printf 'ci: enable backend-test and mysql-smoke, add frontend typecheck+vitest\n\nBackend tests are green after the M2 merge; re-enable the gates that\nwere disabled with if:false.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
Expected: 提交成功。

- [ ] **Step 6: 更新 record.md**

在 `record.md` 追加一条本阶段改动记录（合并 M2 后端、AI provider 泛化、同步逻辑吸收、CI 修复 + 验证结果），提交：
```bash
cd /d/practice/SoftwareEngineering
git add record.md
git commit -m "$(printf 'docs: record phase 1 backend integration + CI fixes\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## 验收（Phase 1 完成标准）

- `./server/mvnw test` 全绿（含 timer/stats/learninglog/ai/provider 测试）。
- `OpenAiCompatibleProvider` 可由 provider 名 `openai` + BYOK 设置驱动。
- 前端 `npx vitest run`（client 根）全绿，含新增同步断言。
- `.github/workflows/ci.yml` 三个 job 启用且 YAML 合法；后端测试不依赖外部 MySQL 即可通过。
- `record.md` 已追加本阶段记录。

## Self-Review 结论

- **Spec 覆盖**：对应 spec §3 阶段 1 全部条目（合并 #67 / 吸收 #61 逻辑 / OpenAI 兼容 provider / 修 CI）。
- **占位符**：无 TBD/TODO 式空步骤；每个代码步骤含具体内容或具体命令。合并冲突解决因依赖真实文件内容，给出按文件的明确取舍策略 + 以测试套件为客观门禁，非占位。
- **类型一致**：`OpenAiCompatibleProvider(baseUrl, model, apiKey)`、`endpoint()`、`AiProviderFactory.getProvider` 在任务间一致；前端 `useSync()` 返回结构一致。
