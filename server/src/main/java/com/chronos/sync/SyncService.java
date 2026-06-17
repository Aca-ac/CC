package com.chronos.sync;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.entity.SyncRecord;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.sync.dto.SyncConflictDto;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SyncService extends ServiceImpl<SyncRecordMapper, SyncRecord> {
    private static final TypeReference<Map<String, Object>> PAYLOAD_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public SyncService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Transactional(rollbackFor = Exception.class)
    public SyncPushResponse push(SyncPushRequest request) {
        String userId = StpUtil.getLoginIdAsString();
        int accepted = 0;

        for (SyncRecordDto dto : request.records()) {
            long version = dto.version() > 0 ? dto.version() : System.currentTimeMillis();
            SyncRecord existing = latestFor(userId, dto.entityType(), dto.entityId());
            if (existing == null) {
                this.save(toEntity(userId, dto, version));
            } else if (version >= nullSafeVersion(existing.getVersion())) {
                existing.setChangeType(dto.changeType());
                existing.setVersion(version);
                existing.setPayload(writePayload(dto.payload()));
                existing.setSyncStatus("SYNCED");
                existing.setLastModifiedAt(LocalDateTime.now());
                existing.setSyncedAt(LocalDateTime.now());
                this.updateById(existing);
            }
            accepted++;
        }

        return new SyncPushResponse(accepted, List.<SyncConflictDto>of());
    }

    public SyncPullResponse pull(String cursor) {
        String userId = StpUtil.getLoginIdAsString();
        long afterVersion = parseCursor(cursor);
        List<SyncRecord> records = this.list(new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getUserId, userId)
                .gt(SyncRecord::getVersion, afterVersion)
                .orderByAsc(SyncRecord::getVersion)
                .orderByAsc(SyncRecord::getId));

        long nextCursor = afterVersion;
        List<SyncRecordDto> changes = records.stream()
                .map(this::toDto)
                .toList();

        for (SyncRecord record : records) {
            nextCursor = Math.max(nextCursor, nullSafeVersion(record.getVersion()));
        }

        return new SyncPullResponse(changes, String.valueOf(nextCursor));
    }

    public void resolve(String conflictId, String resolution) {
        // First release uses last-write-wins, so explicit conflicts are not generated.
        // Keep this endpoint as a no-op for older clients that still call it.
    }

    private SyncRecord latestFor(String userId, String entityType, String entityId) {
        return this.getOne(new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getUserId, userId)
                .eq(SyncRecord::getEntityType, entityType)
                .eq(SyncRecord::getEntityId, entityId)
                .orderByDesc(SyncRecord::getVersion)
                .last("limit 1"), false);
    }

    private SyncRecord toEntity(String userId, SyncRecordDto dto, long version) {
        SyncRecord record = new SyncRecord();
        record.setUserId(userId);
        record.setEntityType(dto.entityType());
        record.setEntityId(dto.entityId());
        record.setChangeType(dto.changeType());
        record.setVersion(version);
        record.setPayload(writePayload(dto.payload()));
        record.setSyncStatus("SYNCED");
        record.setLastModifiedAt(LocalDateTime.now());
        record.setSyncedAt(LocalDateTime.now());
        return record;
    }

    private SyncRecordDto toDto(SyncRecord record) {
        return new SyncRecordDto(
                record.getEntityType(),
                record.getEntityId(),
                record.getChangeType(),
                nullSafeVersion(record.getVersion()),
                readPayload(record.getPayload())
        );
    }

    private String writePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid sync payload.", e);
        }
    }

    private Map<String, Object> readPayload(String payload) {
        try {
            return objectMapper.readValue(payload == null || payload.isBlank() ? "{}" : payload, PAYLOAD_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored sync payload cannot be parsed.", e);
        }
    }

    private static long parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0L;
        try {
            return Long.parseLong(cursor);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static long nullSafeVersion(Long version) {
        return version == null ? 0L : version;
    }
}
