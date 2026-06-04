package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.ai.dto.WeeklyAdviceResponse;
import com.chronos.entity.AiAdvice;
import com.chronos.entity.Project;
import com.chronos.entity.User;
import com.chronos.mapper.AiAdviceMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiAdviceServiceTests {

    @Autowired
    private AiService aiService;

    @Autowired
    private AiAdviceMapper aiAdviceMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String testProjectId;

    @BeforeEach
    void setUp() {
        testUserId = "ai-adv-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("Advice测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);

        testProjectId = "ai-adv-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project project = new Project();
        project.setId(testProjectId);
        project.setUserId(testUserId);
        project.setName("Advice测试项目");
        project.setGoal("测试AI建议");
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(project);
    }

    @Test
    void shouldGenerateWeeklyAdvice() {
        WeeklyAdviceResponse advice = aiService.generateWeeklyAdvice(null);

        assertNotNull(advice.adviceId());
        assertNotNull(advice.content());
        assertEquals("WEEKLY_ADVICE", advice.type());
        assertNotNull(advice.generatedAt());

        AiAdvice saved = aiAdviceMapper.selectById(advice.adviceId());
        assertNotNull(saved);
        assertEquals("WEEKLY_ADVICE", saved.getType());
    }
}
