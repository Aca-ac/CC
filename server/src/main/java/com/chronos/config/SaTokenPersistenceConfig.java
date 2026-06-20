package com.chronos.config;

import cn.dev33.satoken.SaManager;
import cn.dev33.satoken.dao.SaTokenDao;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class SaTokenPersistenceConfig {

    @Bean
    public SaTokenDao saTokenDao(DataSource dataSource) {
        SaTokenDao dao = new MySqlSaTokenDao(dataSource);
        SaManager.setSaTokenDao(dao);
        return dao;
    }
}
