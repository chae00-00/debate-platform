package com.phoenix.debate_service.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Configuration
public class WebClientConfig {

    @Value("${fastapi.url}")
    private String fastApiUrl;

    @Bean
    public WebClient webClient() {
        log.info("WebClient baseUrl: {}", fastApiUrl);
        return WebClient.builder()
                .baseUrl(fastApiUrl)
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.info(">>> {} {}", request.method(), request.url());
            request.headers().forEach((name, values) ->
                log.info(">>> Header: {}={}", name, values));
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.info("<<< Status: {}", response.statusCode());
            return Mono.just(response);
        });
    }
}
