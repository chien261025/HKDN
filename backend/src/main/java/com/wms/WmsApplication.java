package com.wms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Main Class khởi chạy Smart WMS Backend
 * Kiến trúc: Event-Driven Modular Monolith
 */
@SpringBootApplication
@EnableAsync
@EnableTransactionManagement
public class WmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WmsApplication.class, args);
    }
}
