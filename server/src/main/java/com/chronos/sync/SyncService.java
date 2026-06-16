package com.chronos.sync;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.entity.SyncRecord;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SyncService {

    private final SyncRecordMapper syncRecordMapper;

    public SyncService(SyncRecordMapper syncRecordMapper) {
        this.syncRecordMapper = syncRecordMapper;
    }

    @Transactional(rollbackFor = Exception.class)
    public SyncPushResponse push(SyncPushRequest request) {
        String userId = String.valueOf(StpUtil.getLoginId());
        int conflictTotal = 0;

        for (SyncRecordDto dto : request.records()) {
            // 检测冲突：同一 entityType + entityId 存在更高 version 的记录
            SyncRecord existing = syncRecordMapper.selectOne(
                    new LambdaQueryWrapper<SyncRecord>()
                            .eq(SyncRecord::getEntityType, dto.entityType())
                            .eq(SyncRecord::getEntityId, dto.entityId())
                            .orderByDesc(SyncRecord::getVersion)
                            .last("LIMIT 1")
            );

            if (existing != null && existing.getVersion() > dto.version()) {
                conflictTotal++;
                continue;
            }

            SyncRecord record = new SyncRecord();
            record.setEntityType(dto.entityType());
            record.setEntityId(dto.entityId());
            record.setChangeType(dto.changeType());
            record.setVersion(dto.version());
            record.setPayload(dto.payload());
            record.setSyncStatus("PENDING");
            record.setLastModifiedAt(LocalDateTime.now());
            record.setSyncedAt(null);

            syncRecordMapper.insert(record);
        }

        int acceptedTotal = request.records().size() - conflictTotal;
        return new SyncPushResponse(acceptedTotal, conflictTotal);
    }

    public SyncPullResponse pull(String cursor) {
        String userId = String.valueOf(StpUtil.getLoginId());

        // 查询所有 PENDING 状态的同步记录（暂按全局查询，后续可按用户过滤）
        List<SyncRecord> records = syncRecordMapper.selectList(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getSyncStatus, "PENDING")
                        .orderByAsc(SyncRecord::getLastModifiedAt)
                        .last("LIMIT 100")
        );

        List<SyncRecordDto> dtos = records.stream()
                .map(r -> new SyncRecordDto(
                        r.getEntityType(),
                        r.getEntityId(),
                        r.getChangeType(),
                        r.getVersion(),
                        r.getPayload()
                ))
                .collect(Collectors.toList());

        String nextCursor = records.isEmpty()
                ? (cursor == null ? "0" : cursor)
                : String.valueOf(records.get(records.size() - 1).getLastModifiedAt().toEpochSecond(java.time.ZoneOffset.UTC));

        return new SyncPullResponse(dtos, nextCursor);
    }
}
