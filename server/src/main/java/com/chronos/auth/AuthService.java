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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class AuthService {

    private final UserMapper userMapper;
    private final JdbcTemplate jdbcTemplate;

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

    /**
     * 注销账号：永久删除当前用户及其全部关联数据（不可恢复）。
     * 按外键依赖顺序硬删除子表，最后删 users 并清除会话。
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteAccount() {
        String userId = StpUtil.getLoginIdAsString();

        // 习惯打卡 → 习惯
        jdbcTemplate.update(
                "DELETE FROM habit_checkins WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM habits WHERE user_id = ?", userId);

        // AI 建议、AI 设置
        jdbcTemplate.update("DELETE FROM ai_advices WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM ai_settings WHERE user_id = ?", userId);

        // 专注记录、学习日志（依赖 tasks / projects，先删）
        jdbcTemplate.update(
                "DELETE FROM focus_sessions WHERE user_id = ? "
                        + "OR task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?))",
                userId, userId);
        jdbcTemplate.update(
                "DELETE FROM learning_logs WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)", userId);

        // 任务：自引用，先断开父子关系再删除
        jdbcTemplate.update(
                "UPDATE tasks SET parent_task_id = NULL WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)",
                userId);
        jdbcTemplate.update(
                "DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)", userId);

        // 同步记录、项目、用户
        jdbcTemplate.update("DELETE FROM sync_records WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM projects WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);

        StpUtil.logout();
    }
}

