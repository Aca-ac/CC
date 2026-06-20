package com.chronos.auth;

import com.chronos.auth.dto.AuthSessionResponse;
import com.chronos.auth.dto.LoginRequest;
import com.chronos.auth.dto.RegisterRequest;
import com.chronos.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthSessionResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthSessionResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authService.logout();
        return ApiResponse.ok(null);
    }

    /** 注销账号：永久删除当前用户及其全部数据。 */
    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount() {
        authService.deleteAccount();
        return ApiResponse.ok(null);
    }
}

