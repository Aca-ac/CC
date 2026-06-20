# Chronos Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make login persistent across Chronos restarts, repair real client/server synchronization and feature contracts, and provide user-confirmed NSIS auto-updates.

**Architecture:** Store Sa-Token state in MySQL, use a server-sequenced sync event journal with canonical-table application, and bridge Electron updater events through preload IPC. Preserve local-first writes and the existing isolated production topology.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, MySQL/Flyway, React 19/Vitest, Electron/electron-builder/electron-updater.

---

### Task 1: Durable authentication and database migrations

**Files:**
- Create: `server/src/main/java/com/chronos/config/MySqlSaTokenDao.java`
- Create: `server/src/main/java/com/chronos/config/SaTokenPersistenceConfig.java`
- Create: `server/src/main/resources/db/migration/V2__production_hardening.sql`
- Modify: `server/pom.xml`, `server/src/main/resources/application.yml`, `compose.yml`, `database/mysql/schema.sql`, `server/src/main/java/com/chronos/common/GlobalExceptionHandler.java`
- Test: `server/src/test/java/com/chronos/config/MySqlSaTokenDaoTests.java`

- [ ] **Step 1: Write failing persistence and HTTP-status tests**

```java
assertEquals("token-value", dao.get("satoken:test"));
assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
```

- [ ] **Step 2: Run the focused tests and verify they fail because the DAO/migration are absent**

Run: `./server/mvnw test -Dtest=MySqlSaTokenDaoTests`

- [ ] **Step 3: Add MySQL DAO, Flyway migration, settings and compose variables**

```java
@Bean
SaTokenDao saTokenDao(DataSource dataSource) { return new MySqlSaTokenDao(dataSource); }
```

- [ ] **Step 4: Return HTTP 401 while preserving `ApiResponse` for `NotLoginException`**

```java
return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail(UNAUTHORIZED, "请先登录"));
```

- [ ] **Step 5: Run focused backend tests and commit**

Run: `./server/mvnw test -Dtest=MySqlSaTokenDaoTests`

### Task 2: Sync, timer, statistics, and client authentication contract

**Files:**
- Create: `server/src/main/java/com/chronos/sync/SyncEvent.java`, `server/src/main/java/com/chronos/mapper/SyncEventMapper.java`
- Modify: `server/src/main/java/com/chronos/sync/**`, `server/src/main/java/com/chronos/timer/**`, `server/src/main/java/com/chronos/stats/**`, `server/src/main/java/com/chronos/dashboard/DashboardService.java`, `server/src/main/java/com/chronos/project/ProjectService.java`, `server/src/main/java/com/chronos/task/TaskService.java`
- Modify: `client/src/services/apiClient.ts`, `client/src/services/syncService.ts`, `client/src/hooks/useProjects.ts`, `client/src/hooks/useTasks.ts`, `client/src/hooks/useLearningLogs.ts`, `client/src/hooks/useTimer.ts`, `client/src/contexts/AuthContext.tsx`, `client/src/services/statsService.ts`
- Test: `server/src/test/java/com/chronos/sync/SyncServiceTests.java`, `client/src/services/__tests__/syncService.test.ts`, `client/src/hooks/__tests__/useTimer.test.ts`, `client/src/services/__tests__/apiClient.test.ts`

- [ ] **Step 1: Write failing contract tests for envelope unauthorized, sync conflict array/cursor, FOCUS delivery, and timer `id` reuse**

```ts
expect(result.conflicts).toEqual([]);
expect(mockedApi.syncPush).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ entityType: "FOCUS" })]));
```

- [ ] **Step 2: Run focused client and server tests and verify contract failures**

Run: `npx vitest run src/services/__tests__/syncService.test.ts src/hooks/__tests__/useTimer.test.ts --pool=forks --maxWorkers=1`

- [ ] **Step 3: Make the server own sync cursor/revision, apply accepted snapshots to canonical data, and return client-compatible acknowledgements/conflicts**

```java
SyncPullResponse pull(String userId, long cursor) {
  List<SyncEvent> events = eventMapper.selectAfter(userId, cursor);
  return new SyncPullResponse(events.stream().map(this::toDto).toList(), nextCursor(events, cursor));
}
```

- [ ] **Step 4: Send complete local snapshots with base revision; handle HTTP/envelope unauthorized once; align timer, stats, dashboard and time-zone responses**

```ts
if (response.status === 401 || body.code === "UNAUTHORIZED") invalidateSession();
```

- [ ] **Step 5: Run focused tests, then backend/client gates, and commit**

Run: `./server/mvnw test`
Run: `npm run build --workspace client`

### Task 3: User-confirmed desktop updates

**Files:**
- Create: `client/electron/updater.ts`
- Modify: `client/electron/main.ts`, `client/electron/preload.ts`, `client/src/vite-env.d.ts`, `client/src/services/updateService.ts`, `client/src/pages/SettingsPage.tsx`, `client/package.json`, `.github/workflows/windows-installer.yml`
- Test: `client/src/services/__tests__/updateService.test.ts`, `client/electron/__tests__/updater.test.ts`

- [ ] **Step 1: Write failing IPC/update-state tests**

```ts
expect(onUpdateEvent).toHaveBeenCalledWith({ status: "available", version: "1.0.1" });
```

- [ ] **Step 2: Run focused tests and verify the updater bridge is absent**

Run: `npx vitest run src/services/__tests__/updateService.test.ts --pool=forks --maxWorkers=1`

- [ ] **Step 3: Add `electron-updater`, GitHub publish metadata, minimal IPC commands and progress events**

```ts
autoUpdater.autoDownload = false;
ipcMain.handle("chronos:update-download", () => autoUpdater.downloadUpdate());
ipcMain.handle("chronos:update-install", () => autoUpdater.quitAndInstall());
```

- [ ] **Step 4: Render check/download/restart states; keep browser/PWA release-page fallback and state portable limitation**

- [ ] **Step 5: Build the Windows installer, inspect `latest.yml` output, run tests and commit**

Run: `npm run dist:win --workspace client`

### Task 4: Isolated deployment and production verification

**Files:**
- Modify: `record.md`, `docs/deployment.md`, `progress.md`

- [ ] **Step 1: Back up server-local Chronos edits and compare them against committed fixes**
- [ ] **Step 2: Run MySQL migration and BYOK re-encryption preflight without printing keys**
- [ ] **Step 3: Rebuild only Compose project `chronos`, verify nginx configuration, health, login-across-restart, sync, timer, stats and updater release metadata**
- [ ] **Step 4: Verify ByteDance and party-game services/ports remain unchanged and commit deployment documentation**
