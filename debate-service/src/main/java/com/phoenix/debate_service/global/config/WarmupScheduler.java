package com.phoenix.debate_service.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class WarmupScheduler {

    private final WebClient webClient;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("[Warmup] 앱 시작 - FastAPI 연결 예열 중...");
        sendWarmupRequest();
    }

    @Scheduled(fixedRate = 60000) // 1분마다
    public void keepAlive() {
        sendWarmupRequest();
    }

    private void sendWarmupRequest() {
        webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> log.debug("[Warmup] FastAPI 연결 유지 성공"))
                .doOnError(err -> log.warn("[Warmup] FastAPI 연결 실패: {}", err.getMessage()))
                .subscribe();
    }
}
