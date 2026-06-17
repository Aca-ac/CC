package com.chronos.sync;

import com.chronos.common.ApiResponse;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncResolveRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
public class SyncController {
    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/push")
    public ApiResponse<SyncPushResponse> push(@Valid @RequestBody SyncPushRequest request) {
        return ApiResponse.ok(syncService.push(request));
    }

    @GetMapping("/pull")
    public ApiResponse<SyncPullResponse> pull(@RequestParam(required = false) String cursor) {
        return ApiResponse.ok(syncService.pull(cursor));
    }

    @PostMapping("/resolve")
    public ApiResponse<Void> resolve(@RequestBody SyncResolveRequest request) {
        syncService.resolve(request.id(), request.resolution());
        return ApiResponse.ok(null);
    }
}
