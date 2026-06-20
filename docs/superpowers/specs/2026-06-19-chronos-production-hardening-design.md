# Chronos Production Hardening Design

## Goal

Repair the production client/server/database contract, make authentication durable across Chronos API restarts, provide reliable local-first multi-device sync, and add user-confirmed desktop auto-updates without affecting the other server projects.

## Scope

This release covers:

- persistent authentication and a single client-side unauthorized path;
- sync contracts for projects, tasks, learning logs, and focus sessions;
- timer identity, statistics, dashboard isolation, time-zone, and schema migration fixes;
- Electron updater strategy A: automatic checking, user-confirmed download, and user-confirmed restart/install;
- production deployment only through the isolated Chronos checkout, Compose project, container pair, and port.

It does not introduce Redis, modify ByteDance/party-game resources, or silently change unrelated product behavior.

## Alternatives Considered

1. **Recommended: durable MySQL-backed contracts.** Persist Sa-Token state in MySQL, make the server own sync versions and change cursor, and retain the local-first outbox. This fixes restart-induced logout and makes offline/multi-device synchronization defensible.
2. **Client-only compatibility patch.** Adapt response fields and call existing REST endpoints directly. This is quicker but leaves cursor correctness, offline focus-session loss, and multi-device conflict handling unresolved.
3. **Redis plus a generic update host.** Appropriate for larger scale, but adds a service and operational surface that the project does not currently need.

## Architecture

### Authentication

- Add a MySQL-backed `SaTokenDao` and a `sa_token_store` migration table. Store string and object values with an expiry timestamp; expired rows read as absent and are deleted opportunistically.
- Configure a 30-day token timeout with no unexpected active-timeout expiry. Container restart must not invalidate a valid login.
- Return HTTP 401 for `NotLoginException` while retaining the common response envelope.
- Centralize client handling for either HTTP 401 or envelope `code: "UNAUTHORIZED"`: remove the stored session, notify `AuthProvider`, and navigate to login. Network and ordinary 403/validation failures must not clear a valid offline session.

### Sync and Canonical Data

- Add an append-only `sync_events` journal with an ordered server cursor and retain `sync_records` as the latest per-user entity snapshot.
- The server assigns an entity revision and event sequence only after an accepted mutation. Client records retain `serverVersion`; outbound mutations carry their base revision.
- On a revision mismatch, the server returns an explicit conflict object containing the current server snapshot. It does not mutate that snapshot or hide it from future pull operations.
- `pull(cursor)` returns only events after the cursor. Accepted mutations update the relevant canonical business table and emit a sync event in one transaction.
- The client sends full snapshots for create/update/delete and includes `FOCUS`; it updates local `serverVersion` from acknowledged or pulled data. Conflict resolution resubmits the kept-local payload with the server revision, or applies the cloud payload and removes the outbox entry.

### Contract and Data Integrity

- Use Flyway migrations for fresh and existing MySQL installations. The first migration is the canonical schema; follow-up migrations safely add the production-missing focus columns, AI settings, sync data, token store, indexes, and existing-database compatibility changes.
- Preserve and formalize the existing production hotfixes: `ai_settings`, forwarded HTTPS headers, null-safe task defaults, and production Maven build behavior.
- Pass `CHRONOS_AI_MASTER_KEY` into the API container. Before switching from the previously used built-in default key, re-encrypt the existing BYOK ciphertext in a transaction using the configured key without logging plaintext.
- Use `Asia/Shanghai` consistently in the API container and JDBC/session configuration. Add an integration assertion that a submitted `+08:00` due time is returned unchanged.
- Make project creation return `ACTIVE` and `0`; make task responses return non-null `actualMinutes` and `tags`; return statistics in the client’s documented units (percent 0-100 and minutes).
- Scope dashboard sync-pending counts by current user.

### Timer

- The local-generated focus-session ID is sent to the server at timer start, so local state, server state, stop/discard calls, and restored sessions share one ID.
- The API uses one `id` field consistently. Focus-session sync remains an offline fallback, not a silently discarded mutation type.

### Desktop Updater

- Use `electron-updater` with an electron-builder GitHub publish configuration for `Vincent-Ctrl-18/Chronos`.
- Only NSIS installation builds receive automatic updates. Portable builds display an explicit manual-update limitation.
- At application start, Electron checks for a release without downloading. The renderer can request a check, display release information, then explicitly request download. Progress is relayed through narrow preload IPC. After `update-downloaded`, the user explicitly chooses restart/install; otherwise the update is installed on the next normal start.
- The release workflow publishes the NSIS executable, `latest.yml`, and matching blockmap together in a non-draft GitHub release. The current unsigned Windows distribution remains functional but code signing stays a production follow-up.

## Error Handling and Observability

- Synchronization responses contain stable machine-readable code, conflict detail, accepted revisions, and cursor values.
- The client preserves retryable outbox entries on transient failure and reports actionable sync state. It never marks an unsupported entity as synced.
- Updater errors remain non-blocking and surface a clear message; no automatic quit occurs until the user approves installation.
- Server logs record sync entity identifiers, revision decisions, and cursor movements but never token or BYOK plaintext.

## Verification

- Backend tests cover durable Sa-Token values across a recreated DAO, 401 response status, event cursor progression, accepted mutations reaching canonical tables, conflict resolution, focus synchronization, time-zone preservation, dashboard user isolation, and statistic contract values.
- Client tests cover the envelope/HTTP unauthorized path, local server-version behavior, focus outbox delivery, pull idempotence, timer ID usage, stats mapping, and updater IPC state transitions.
- A packaged NSIS smoke test verifies check, consented download, and restart/install against a non-draft release asset.
- Production smoke tests use a disposable user, validate login across a Chronos-only API restart, synchronize a project/task/log/focus session, verify stats/dashboard, then remove test data. ByteDance and party-game processes, ports, directories, and nginx routes are only checked, never changed.

## Deployment Safety

- Back up the dirty production Chronos checkout before replacing files; do not use `git reset --hard` there.
- Only operate in `/var/www/chronos`, Compose project `chronos`, containers `chronos-api-1` / `chronos-db-1`, and port 8782.
- Run schema and BYOK re-encryption preflight before switching the API container. If any preflight fails, keep the existing API container running and stop the release.
