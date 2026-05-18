package com.phoenix.debate_service.debate.controller;

import com.phoenix.debate_service.debate.dto.AssistantResponse;
import com.phoenix.debate_service.debate.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debate/{sessionId}/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    /**
     * 어시스턴트(비비드) 안내문 조회
     * GET /api/debate/{sessionId}/assistant/{phase}
     *
     * @param sessionId 토론 세션 ID
     * @param phase 토론 단계 (opening, chained_rebuttal, free_rebuttal, role_reversal, synthesis)
     * @param opponentId 상대 에이전트 ID (free_rebuttal 단계에서만 사용, 선택 사항)
     */
    @GetMapping("/{phase}")
    public ResponseEntity<AssistantResponse> getAssistantGuide(
            @PathVariable String sessionId,
            @PathVariable String phase,
            @RequestParam(required = false) String opponentId) {

        AssistantResponse response = assistantService.getGuide(sessionId, phase, opponentId);
        return ResponseEntity.ok(response);
    }
}
