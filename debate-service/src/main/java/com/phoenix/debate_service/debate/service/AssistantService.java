package com.phoenix.debate_service.debate.service;

import com.phoenix.debate_service.debate.dto.AssistantResponse;
import com.phoenix.debate_service.global.exception.FastApiClientException;
import com.phoenix.debate_service.global.exception.InvalidPhaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantService {

    private final WebClient webClient;

    private static final Set<String> SUPPORTED_PHASES = Set.of(
            "opening", "chained_rebuttal", "free_rebuttal", "role_reversal", "synthesis"
    );

    public AssistantResponse getGuide(String sessionId, String phase, String opponentId) {
        // 1. phase 유효성 검증
        if (!SUPPORTED_PHASES.contains(phase)) {
            throw new InvalidPhaseException(
                    "지원하지 않는 phase '" + phase + "'. 지원: " + SUPPORTED_PHASES
            );
        }

        log.info("어시스턴트 안내문 요청 - sessionId: {}, phase: {}, opponentId: {}",
                sessionId, phase, opponentId);

        // 2. FastAPI 호출
        Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/debate/{sessionId}/assistant/{phase}");
                    if (opponentId != null && !opponentId.isEmpty()) {
                        uriBuilder.queryParam("opponent_id", opponentId);
                    }
                    return uriBuilder.build(sessionId, phase);
                })
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        FastApiClientException.fromResponse(
                                                clientResponse.statusCode(),
                                                "어시스턴트 안내문 요청 실패",
                                                body
                                        )
                                ))
                )
                .bodyToMono(Map.class)
                .block();

        log.info("어시스턴트 안내문 응답 수신 - sessionId: {}", sessionId);

        return AssistantResponse.builder()
                .sessionId((String) response.get("session_id"))
                .phase((String) response.get("phase"))
                .text((String) response.get("text"))
                .build();
    }
}
