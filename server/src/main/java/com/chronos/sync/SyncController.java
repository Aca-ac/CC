package com.chronos.sync;

import com.chronos.common.ApiResponse;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    @PostMapping("/push")
    public ApiResponse<SyncPushResponse> push(@Valid @RequestBody SyncPushRequest request) {
        // TODO(数据同步模块): 按 entityType/entityId/version 检测冲突并返回待处理记录。
        return ApiResponse.ok(new SyncPushResponse(request.records().size(), 0));
    }

    @GetMapping("/pull")
    public ApiResponse<SyncPullResponse> pull() {
        // TODO(数据同步模块): 根据客户端最后同步版本返回增量变更。
        return ApiResponse.ok(new SyncPullResponse(List.of(), "dev-sync-cursor"));
    }
}

