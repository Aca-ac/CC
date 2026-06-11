package com.chronos.auth;

import cn.dev33.satoken.secure.SaSecureUtil;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.auth.dto.AuthSessionResponse;
import com.chronos.auth.dto.LoginRequest;
import com.chronos.auth.dto.RegisterRequest;
import com.chronos.entity.User;
import com.chronos.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class AuthService {

    private final UserMapper userMapper;

    // 定义一个固定的盐值（工业规范：生产环境建议写在 application.yml 中读取）
    private static final String SALT = "Chronos_Salt_998243";

    @Transactional(rollbackFor = Exception.class)
    public AuthSessionResponse register(RegisterRequest request) {
        // 1. 校验邮箱唯一性

        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
            .eq(User::getEmail, request.email()));
        if (count > 0) {
            throw new IllegalArgumentException("该邮箱已被注册！");
        }

        String hashedPassword = SaSecureUtil.sha256BySalt(request.password(), SALT);

        // 3. 写入数据库
        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(hashedPassword);
        userMapper.insert(user);

        // 4. 登录并返回
        StpUtil.login(user.getId());
        return new AuthSessionResponse(String.valueOf(user.getId()), user.getName(), user.getEmail(), StpUtil.getTokenValue());
    }

    public AuthSessionResponse login(LoginRequest request) {
        // 1. 查找用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
            .eq(User::getEmail, request.email()));
        if (user == null) {
            throw new IllegalArgumentException("用户不存在或密码错误！");
        }

        // 2. 🌟 将用户输入的密码用同样的盐值加密，然后直接比对字符串
        String inputPasswordHashed = SaSecureUtil.sha256BySalt(request.password(), SALT);
        if (!inputPasswordHashed.equals(user.getPasswordHash())) {
            throw new IllegalArgumentException("用户不存在或密码错误！");
        }

        // 3. 登录并返回真实 Token
        StpUtil.login(user.getId());
        return new AuthSessionResponse(String.valueOf(user.getId()), user.getName(), user.getEmail(), StpUtil.getTokenValue());
    }

    public void logout() {
        StpUtil.logout();
    }
}

