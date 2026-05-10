package com.phoenix.debate_service.debate.service;

import com.phoenix.debate_service.debate.dto.EvaluationRequest;
import com.phoenix.debate_service.debate.dto.EvaluationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final WebClient webClient;

    public EvaluationResponse evaluate(String topicId, EvaluationRequest request) {
        log.info("[evaluation] topicId={} 평가 요청", topicId);
        try {
            EvaluationResponse response = webClient.post()
                    .uri("/evaluation?topic_id=" + topicId)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EvaluationResponse.class)
                    .block();
            log.info("[evaluation] topicId={} 평가 완료", topicId);
            return response;
        } catch (WebClientResponseException e) {
            log.error("[evaluation] FastAPI 오류 status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI 평가 서버 오류: " + e.getStatusCode() + " — AI 서버가 재시작되지 않았을 수 있습니다."
            );
        } catch (Exception e) {
            log.error("[evaluation] 평가 요청 실패", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 평가 서버 연결 실패: " + e.getMessage());
        }
    }
}
