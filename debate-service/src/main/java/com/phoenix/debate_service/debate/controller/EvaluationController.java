package com.phoenix.debate_service.debate.controller;

import com.phoenix.debate_service.debate.dto.EvaluationRequest;
import com.phoenix.debate_service.debate.dto.EvaluationResponse;
import com.phoenix.debate_service.debate.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluation")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    /**
     * 토론 전후 사용자 답변 평가
     * POST /api/evaluation?topicId=poli_002&sessionId=123
     */
    @PostMapping
    public ResponseEntity<EvaluationResponse> evaluate(
            @RequestParam String topicId,
            @RequestParam Long sessionId,
            @RequestBody EvaluationRequest request
    ) {
        return ResponseEntity.ok(evaluationService.evaluate(topicId, sessionId, request));
    }
}
