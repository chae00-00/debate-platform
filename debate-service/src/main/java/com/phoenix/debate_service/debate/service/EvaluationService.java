package com.phoenix.debate_service.debate.service;

import com.phoenix.debate_service.debate.domain.*;
import com.phoenix.debate_service.debate.dto.EvaluationRequest;
import com.phoenix.debate_service.debate.dto.EvaluationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final WebClient webClient;
    private final DebateSessionRepository sessionRepository;
    private final PrePostAnswerRepository prePostAnswerRepository;
    private final EvaluationResultRepository evaluationResultRepository;

    @Transactional
    public EvaluationResponse evaluate(String topicId, Long sessionId, EvaluationRequest request) {
        log.info("[evaluation] topicId={} sessionId={} 평가 요청", topicId, sessionId);

        // 1. 세션 조회
        DebateSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "세션을 찾을 수 없습니다: " + sessionId));

        // 2. 사전/사후 답변 저장
        PrePostAnswer answer = PrePostAnswer.builder()
                .user(session.getUser())
                .session(session)
                .topicId(topicId)
                .prePro(request.getPrePro())
                .preCon(request.getPreCon())
                .postPro(request.getPostPro())
                .postCon(request.getPostCon())
                .build();
        prePostAnswerRepository.save(answer);
        log.info("[evaluation] 사전/사후 답변 저장 완료");

        // 3. FastAPI 호출
        EvaluationResponse response = callFastApi(topicId, request);

        // 4. 평가 결과 저장
        saveEvaluationResult(session, topicId, response);
        log.info("[evaluation] 평가 결과 저장 완료");

        return response;
    }

    private EvaluationResponse callFastApi(String topicId, EvaluationRequest request) {
        try {
            EvaluationResponse response = webClient.post()
                    .uri("/evaluation?topic_id=" + topicId)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EvaluationResponse.class)
                    .block();
            log.info("[evaluation] topicId={} FastAPI 평가 완료", topicId);
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

    private void saveEvaluationResult(DebateSession session, String topicId, EvaluationResponse res) {
        var pro = res.getPro();
        var con = res.getCon();
        var proPre = pro != null ? pro.getPre() : null;
        var proPost = pro != null ? pro.getPost() : null;
        var conPre = con != null ? con.getPre() : null;
        var conPost = con != null ? con.getPost() : null;

        EvaluationResult result = EvaluationResult.builder()
                .user(session.getUser())
                .session(session)
                .topicId(topicId)
                // 찬성 사전
                .proPreAcceptability(getScore(proPre, "acceptability"))
                .proPreRelevance(getScore(proPre, "relevance"))
                .proPreSufficiency(getScore(proPre, "sufficiency"))
                .proPreClarity(getScore(proPre, "clarity"))
                .proPreAppropriateness(getScore(proPre, "appropriateness"))
                .proPreAverage(proPre != null ? proPre.getAverage100() : null)
                .proPreSummary(proPre != null ? proPre.getOverallSummary() : null)
                // 찬성 사후
                .proPostAcceptability(getScore(proPost, "acceptability"))
                .proPostRelevance(getScore(proPost, "relevance"))
                .proPostSufficiency(getScore(proPost, "sufficiency"))
                .proPostClarity(getScore(proPost, "clarity"))
                .proPostAppropriateness(getScore(proPost, "appropriateness"))
                .proPostAverage(proPost != null ? proPost.getAverage100() : null)
                .proPostSummary(proPost != null ? proPost.getOverallSummary() : null)
                .proDelta(pro != null ? pro.getDelta100() : null)
                // 반대 사전
                .conPreAcceptability(getScore(conPre, "acceptability"))
                .conPreRelevance(getScore(conPre, "relevance"))
                .conPreSufficiency(getScore(conPre, "sufficiency"))
                .conPreClarity(getScore(conPre, "clarity"))
                .conPreAppropriateness(getScore(conPre, "appropriateness"))
                .conPreAverage(conPre != null ? conPre.getAverage100() : null)
                .conPreSummary(conPre != null ? conPre.getOverallSummary() : null)
                // 반대 사후
                .conPostAcceptability(getScore(conPost, "acceptability"))
                .conPostRelevance(getScore(conPost, "relevance"))
                .conPostSufficiency(getScore(conPost, "sufficiency"))
                .conPostClarity(getScore(conPost, "clarity"))
                .conPostAppropriateness(getScore(conPost, "appropriateness"))
                .conPostAverage(conPost != null ? conPost.getAverage100() : null)
                .conPostSummary(conPost != null ? conPost.getOverallSummary() : null)
                .conDelta(con != null ? con.getDelta100() : null)
                .build();

        evaluationResultRepository.save(result);
    }

    private Integer getScore(EvaluationResponse.PhaseResult phase, String metric) {
        if (phase == null) return null;
        EvaluationResponse.MetricScore ms = switch (metric) {
            case "acceptability" -> phase.getLocalAcceptability();
            case "relevance" -> phase.getLocalRelevance();
            case "sufficiency" -> phase.getLocalSufficiency();
            case "clarity" -> phase.getClarity();
            case "appropriateness" -> phase.getAppropriateness();
            default -> null;
        };
        return ms != null ? ms.getScore() : null;
    }
}
