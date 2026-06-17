package com.chronos.sync;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SyncSchemaInitializer {
    private static final Logger log = LoggerFactory.getLogger(SyncSchemaInitializer.class);

    @Bean
    ApplicationRunner ensureSyncSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            apply(jdbcTemplate, "ALTER TABLE sync_records ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'legacy'");
            apply(jdbcTemplate, "CREATE INDEX idx_sync_records_user_cursor ON sync_records(user_id, version, id)");
        };
    }

    private static void apply(JdbcTemplate jdbcTemplate, String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            log.debug("Skipping sync schema statement: {}", sql, e);
        }
    }
}
