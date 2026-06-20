package com.chronos.config;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MySqlSaTokenDaoTests {

    private JdbcDataSource dataSource;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:sa_token_dao;MODE=MySQL;DB_CLOSE_DELAY=-1");
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.execute("DROP TABLE IF EXISTS sa_token_store");
            statement.execute("CREATE TABLE sa_token_store (store_key VARCHAR(255) PRIMARY KEY, value_type VARCHAR(16) NOT NULL, value_data CLOB NOT NULL, expires_at TIMESTAMP NULL)");
        }
    }

    @Test
    void keepsStringTokenWhenDaoIsRecreated() {
        MySqlSaTokenDao writer = new MySqlSaTokenDao(dataSource);
        writer.set("satoken:token:test", "token-value", 60);

        MySqlSaTokenDao reader = new MySqlSaTokenDao(dataSource);

        assertEquals("token-value", reader.get("satoken:token:test"));
        assertTrue(reader.getTimeout("satoken:token:test") >= 58);
    }

    @Test
    void treatsExpiredTokenAsMissing() {
        MySqlSaTokenDao dao = new MySqlSaTokenDao(dataSource);
        dao.set("satoken:token:expired", "expired", 0);

        assertNull(dao.get("satoken:token:expired"));
    }
}
