package com.chronos;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChronosApplication {

    public static void main(String[] args) {
        // 加载 .env 文件，将变量注入系统属性，供 application.yml 中的 ${...} 占位符使用
        Dotenv dotenv = Dotenv.configure()
                .directory("../")
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));

        SpringApplication.run(ChronosApplication.class, args);
    }
}

