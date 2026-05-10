package com.phoenix.debate_service.debate.controller;

import com.phoenix.debate_service.debate.dto.*;
import com.phoenix.debate_service.debate.service.DebateService;
import com.phoenix.debate_service.global.auth.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/debates")
@RequiredArgsConstructor
public class DebateController {

    private final DebateService debateService;

    /**
     * 토론 사전 준비 — stage 3(사전 근거 작성) 진입 시 호출
     * FastAPI /debate/init 을 백그라운드로 시작하고 session_id 를 즉시 반환.
     * POST /api/debates/prepare
     */
    @PostMapping("/prepare")
    public ResponseEntity<PrepareResponse> prepareDebate(
            @AuthenticationPrincipal CustomOAuth2User user,
            @RequestBody DebateCreateRequest request
    ) {
        Long userId = (user != null) ? user.getUserId() : null;
        return ResponseEntity.ok(debateService.prepareDebate(userId, request));
    }

    /**
     * 버퍼 replay + 실시간 스트리밍
     * prepare 로 쌓인 에이전트 입론을 SSE 로 전송.
     * GET /api/debates/{sessionId}/stream
     */
    @GetMapping(value = "/{sessionId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDebate(@PathVariable String sessionId) {
        return debateService.streamDebate(sessionId);
    }

    /**
     * 토론 생성 및 AI 입론 SSE 스트리밍 (prepare 없이 직접 호출 시 폴백)
     * POST /api/debates
     */
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter initDebate(
            @AuthenticationPrincipal CustomOAuth2User user,
            @RequestBody DebateCreateRequest request
    ) {
        Long userId = (user != null) ? user.getUserId() : null;
        return debateService.initDebate(userId, request);
    }

    /**
     * 토론 상태 조회
     * GET /api/debates/{sessionId}/state
     */
    @GetMapping("/{sessionId}/state")
    public ResponseEntity<DebateStateResponse> getState(@PathVariable String sessionId) {
        DebateStateResponse response = debateService.getState(sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 입력 제출 및 AI 응답 SSE 스트리밍
     * POST /api/debates/{sessionId}/submit
     */
    @PostMapping(value = "/{sessionId}/submit", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter submit(
            @PathVariable String sessionId,
            @RequestBody SubmitRequest request
    ) {
        return debateService.submit(sessionId, request);
    }

    /**
     * 토론 최종 리포트 (swing turns 포함)
     * GET /api/debates/{sessionId}/final-report
     */
    @GetMapping("/{sessionId}/final-report")
    public ResponseEntity<Map<String, Object>> getFinalReport(@PathVariable String sessionId) {
        return ResponseEntity.ok(debateService.getFinalReport(sessionId));
    }
}
