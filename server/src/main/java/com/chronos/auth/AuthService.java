package com.chronos.auth;

import com.chronos.auth.dto.AuthSessionResponse;
import com.chronos.auth.dto.LoginRequest;
import com.chronos.auth.dto.RegisterRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public AuthSessionResponse register(RegisterRequest request) {
        // TODO(后端B): 校验邮箱唯一性、加盐哈希密码，并写入 users 表。
        return new AuthSessionResponse("mock-user", request.name(), request.email(), "dev-token");
    }

    public AuthSessionResponse login(LoginRequest request) {
        // TODO(后端B): 校验密码哈希，生成 JWT，并返回用户摘要。
        return new AuthSessionResponse("mock-user", "演示用户", request.email(), "dev-token");
    }
}

