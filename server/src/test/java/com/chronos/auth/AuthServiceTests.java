package com.chronos.auth;

import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Date;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class AuthServiceTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void deleteAccountRemovesAllUserDataButKeepsOtherUsers() {
        String uid = "del-" + UUID.randomUUID().toString().substring(0, 8);
        String other = "keep-" + UUID.randomUUID().toString().substring(0, 8);

        jdbc.update("INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)",
                uid, "Del", uid + "@t.com", "h");
        jdbc.update("INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)",
                other, "Keep", other + "@t.com", "h");

        String pid = "p-" + uid;
        jdbc.update("INSERT INTO projects(id,user_id,name,goal,start_date,end_date) VALUES(?,?,?,?,?,?)",
                pid, uid, "P", "g", Date.valueOf("2026-01-01"), Date.valueOf("2026-02-01"));
        String tid = "t-" + uid;
        String sub = "ts-" + uid;
        jdbc.update("INSERT INTO tasks(id,project_id,title) VALUES(?,?,?)", tid, pid, "T");
        jdbc.update("INSERT INTO tasks(id,project_id,parent_task_id,title) VALUES(?,?,?,?)", sub, pid, tid, "Sub");
        jdbc.update("INSERT INTO learning_logs(id,project_id,task_id,content) VALUES(?,?,?,?)", "l-" + uid, pid, tid, "log");
        jdbc.update("INSERT INTO focus_sessions(id,user_id,task_id,started_at,duration_minutes) VALUES(?,?,?,?,?)",
                "f-" + uid, uid, tid, LocalDateTime.now(), 25);
        String hid = "h-" + uid;
        jdbc.update("INSERT INTO habits(id,user_id,name,rule_text) VALUES(?,?,?,?)", hid, uid, "H", "daily");
        jdbc.update("INSERT INTO habit_checkins(id,habit_id,checked_date) VALUES(?,?,?)", "c-" + uid, hid, Date.valueOf("2026-01-02"));
        jdbc.update("INSERT INTO ai_settings(id,user_id,provider,encrypted_key) VALUES(?,?,?,?)", "a-" + uid, uid, "OPENAI", "enc");
        jdbc.update("INSERT INTO ai_advices(id,user_id,project_id,type,title,content) VALUES(?,?,?,?,?,?)",
                "ad-" + uid, uid, pid, "REVIEW", "t", "c");
        jdbc.update("INSERT INTO sync_records(id,user_id,entity_type,entity_id,change_type) VALUES(?,?,?,?,?)",
                "s-" + uid, uid, "TASK", tid, "CREATE");

        // 另一个用户的项目，删除后应保留
        jdbc.update("INSERT INTO projects(id,user_id,name,goal,start_date,end_date) VALUES(?,?,?,?,?,?)",
                "p-" + other, other, "OP", "g", Date.valueOf("2026-01-01"), Date.valueOf("2026-02-01"));

        StpUtil.login(uid);
        authService.deleteAccount();

        assertEquals(0, count("users", "id", uid));
        assertEquals(0, count("projects", "user_id", uid));
        assertEquals(0, count("tasks", "project_id", pid));
        assertEquals(0, count("learning_logs", "project_id", pid));
        assertEquals(0, count("focus_sessions", "user_id", uid));
        assertEquals(0, count("habits", "user_id", uid));
        assertEquals(0, count("habit_checkins", "habit_id", hid));
        assertEquals(0, count("ai_settings", "user_id", uid));
        assertEquals(0, count("ai_advices", "user_id", uid));
        assertEquals(0, count("sync_records", "user_id", uid));

        // 其他用户数据完好
        assertEquals(1, count("users", "id", other));
        assertEquals(1, count("projects", "user_id", other));
    }

    private int count(String table, String column, String value) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?", Integer.class, value);
        return n == null ? 0 : n;
    }
}
