package com.chronos.sync;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.entity.SyncRecord;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import com.chronos.sync.dto.SyncResolveRequest;
import com.chronos.sync.dto.SyncResolveResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SyncService extends ServiceImpl<SyncRecordMapper, SyncRecord> {

    @Transactional(rollbackFor = Exception.class)
    public SyncPushResponse push(SyncPushRequest request) {
        int acceptedTotal = 0;
        int conflictTotal = 0;

        for (SyncRecordDto dto : request.records()) {
            SyncRecord existing = this.getOne(
                new LambdaQueryWrapper<SyncRecord>()
                    .eq(SyncRecord::getEntityType, dto.entityType())
                    .eq(SyncRecord::getEntityId, dto.entityId())
            );

            if (existing != null && existing.getVersion() > dto.version()) {
                conflictTotal++;
                existing.setSyncStatus("CONFLICT");
                this.updateById(existing);
            } else {
                SyncRecord record = new SyncRecord();
                record.setId(UUID.randomUUID().toString());
                record.setEntityType(dto.entityType());
                record.setEntityId(dto.entityId());
                record.setChangeType(dto.changeType());
                record.setVersion(dto.version());
                record.setPayload(dto.payload());
                record.setSyncStatus("PENDING");
                record.setLastModifiedAt(LocalDateTime.now());

                if (existing != null) {
                    record.setId(existing.getId());
                    record.setSyncedAt(existing.getSyncedAt());
                }

                this.saveOrUpdate(record);
                acceptedTotal++;
            }
        }

        return new SyncPushResponse(acceptedTotal, conflictTotal);
    }

    public SyncPullResponse pull() {
        List<SyncRecord> pendingRecords = this.list(
            new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getSyncStatus, "PENDING")
                .orderByDesc(SyncRecord::getLastModifiedAt)
        );

        List<SyncRecordDto> records = pendingRecords.stream()
            .map(record -> new SyncRecordDto(
                record.getEntityType(),
                record.getEntityId(),
                record.getChangeType(),
                record.getVersion(),
                record.getPayload()
            ))
            .collect(Collectors.toList());

        String nextCursor = "sync-cursor-" + System.currentTimeMillis();

        return new SyncPullResponse(records, nextCursor);
    }

    @Transactional(rollbackFor = Exception.class)
    public SyncResolveResponse resolve(SyncResolveRequest request) {
        SyncRecord existing = this.getOne(
            new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getEntityType, request.entityType())
                .eq(SyncRecord::getEntityId, request.entityId())
        );

        if (existing == null) {
            return new SyncResolveResponse(false, "未找到冲突记录");
        }

        if (!"CONFLICT".equals(existing.getSyncStatus())) {
            return new SyncResolveResponse(false, "该记录当前状态不是冲突状态");
        }

        existing.setVersion(request.version());
        existing.setPayload(request.resolvedPayload());
        existing.setSyncStatus("PENDING");
        existing.setLastModifiedAt(LocalDateTime.now());
        this.updateById(existing);

        return new SyncResolveResponse(true, "冲突已解决，记录已更新为待同步状态");
    }
}