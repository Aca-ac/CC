package com.chronos.sync;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.User;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.UserMapper;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import com.chronos.sync.dto.SyncResolveRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SyncServiceTests {

    @Autowired
    private SyncService syncService;

    @Autowired
    private SyncRecordMapper syncRecordMapper;

    @Autowired
    private UserMapper userMapper;

    private String userId;
    private String otherUserId;

    @BeforeEach
    void setUp() {
        userId = "sync-user-" + UUID.randomUUID().toString().substring(0, 8);
        otherUserId = "sync-other-" + UUID.randomUUID().toString().substring(0, 8);
        insertUser(userId, "同步测试用户");
        insertUser(otherUserId, "其他同步用户");
    }

    @Test
    void pushWritesUserIdAndPullFiltersByUser() {
        String sharedEntityId = "task-" + UUID.randomUUID().toString().substring(0, 8);

        SyncPushResponse userPush = syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", sharedEntityId, "UPDATE", 1, Map.of("title", "我的任务"))
        )));
        SyncPushResponse otherPush = syncService.push(otherUserId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", sharedEntityId, "UPDATE", 1, Map.of("title", "他人任务"))
        )));

        assertEquals(1, userPush.accepted());
        assertEquals(0, userPush.conflictTotal());
        assertEquals(1, otherPush.accepted());
        assertEquals(0, otherPush.conflictTotal());

        List<SyncRecord> stored = syncRecordMapper.selectList(
                new LambdaQueryWrapper<SyncRecord>().eq(SyncRecord::getEntityId, sharedEntityId)
        );
        assertEquals(2, stored.size());
        assertTrue(stored.stream().anyMatch(record -> userId.equals(record.getUserId())));
        assertTrue(stored.stream().anyMatch(record -> otherUserId.equals(record.getUserId())));

        var pulled = syncService.pull(userId, null);
        assertEquals(1, pulled.changes().size());
        assertEquals("我的任务", pulled.changes().get(0).payload().get("title"));
    }

    @Test
    void resolveOnlyTouchesCurrentUsersConflict() {
        String entityId = "task-conflict-" + UUID.randomUUID().toString().substring(0, 8);

        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", entityId, "UPDATE", 5, Map.of("title", "server"))
        )));
        SyncPushResponse conflict = syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", entityId, "UPDATE", 1, Map.of("title", "client"))
        )));

        assertEquals(1, conflict.conflictTotal());

        SyncResolveRequest request = new SyncResolveRequest(
                "TASK",
                entityId,
                6,
                "{\"title\":\"resolved\"}",
                "local"
        );

        assertFalse(syncService.resolve(otherUserId, request).success());
        assertTrue(syncService.resolve(userId, request).success());

        SyncRecord resolved = syncRecordMapper.selectOne(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getUserId, userId)
                        .eq(SyncRecord::getEntityType, "TASK")
                        .eq(SyncRecord::getEntityId, entityId)
        );
        assertEquals("PENDING", resolved.getSyncStatus());
        assertEquals(6, resolved.getVersion());
    }

    private void insertUser(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(id + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
    }
}
