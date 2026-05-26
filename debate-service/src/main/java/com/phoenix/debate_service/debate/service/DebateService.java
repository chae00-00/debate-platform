package com.phoenix.debate_service.debate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.phoenix.debate_service.debate.domain.*;
import com.phoenix.debate_service.debate.dto.*;
import com.phoenix.debate_service.topic.domain.Topic;
import com.phoenix.debate_service.topic.domain.TopicRepository;
import com.phoenix.debate_service.user.domain.Provider;
import com.phoenix.debate_service.user.domain.User;
import com.phoenix.debate_service.user.domain.UserRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DebateService {

    private static final String TEST_USER_SOCIAL_ID = "test-user-001";
    private static final int PREPARE_SESSION_TIMEOUT_SECONDS = 45;

    private final RestTemplate restTemplate;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DebateSessionRepository debateSessionRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final UserUtteranceRepository userUtteranceRepository;
    private final AgentUtteranceRepository agentUtteranceRepository;

    // FastAPI sessionId -> Java sessionId 매핑
    private final Map<String, Long> sessionIdMap = new ConcurrentHashMap<>();

    // FastAPI sessionId -> 사전 버퍼 (prepare → stream 핸드오프)
    private final Map<String, BufferedSession> bufferMap = new ConcurrentHashMap<>();

    @Value("${fastapi.url}")
    private String fastApiUrl;

    // ── 버퍼 자료구조 ─────────────────────────────────────────────────────────

    @Getter
    static class BufferedEvent {
        final String eventType;
        final DebateEventResponse data;

        BufferedEvent(String eventType, DebateEventResponse data) {
            this.eventType = eventType;
            this.data = data;
        }
    }

    static class BufferedSession {
        final List<BufferedEvent> events = new CopyOnWriteArrayList<>();
        volatile boolean streamComplete = false;   // FastAPI 스트림 종료 여부
        volatile SseEmitter liveEmitter = null;     // 프론트엔드 연결 시 실시간 포워딩
        volatile String fastApiSessionId = null;    // 세션 ID
        final Object lock = new Object();
    }

    // ── 토론 사전 준비 (non-SSE, JSON 응답) ──────────────────────────────────

    /**
     * POST /api/debates/prepare
     * FastAPI /debate/init 을 백그라운드에서 미리 시작하고, session_id 를 즉시 반환.
     * 이후 에이전트 입론은 내부 버퍼에 쌓이며, /stream 으로 replay.
     */
    public PrepareResponse prepareDebate(Long userId, DebateCreateRequest request) {
        User user = (userId != null)
                ? userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
                : getOrCreateTestUser();

        Topic topic = topicRepository.findByTitle(request.getTopic())
                .or(() -> topicRepository.findById(request.getTopic()))
                .orElseThrow(() -> new IllegalArgumentException("주제를 찾을 수 없습니다: " + request.getTopic()));

        FastApiDebateRequest fastApiRequest = FastApiDebateRequest.from(request, topic.getId());

        CompletableFuture<String> sessionIdFuture = new CompletableFuture<>();
        BufferedSession session = new BufferedSession();

        webClient.post()
                .uri("/debate/init")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(fastApiRequest)
                .retrieve()
                .bodyToFlux(ServerSentEvent.class)
                .subscribe(
                        event -> handlePrepareEvent(event, user, topic, request, session, sessionIdFuture),
                        error -> {
                            log.error("[prepare] SSE 스트리밍 오류", error);
                            sessionIdFuture.completeExceptionally(error);
                            synchronized (session.lock) {
                                session.streamComplete = true;
                                if (session.liveEmitter != null) {
                                    session.liveEmitter.completeWithError(error);
                                    session.liveEmitter = null;
                                }
                            }
                        },
                        () -> {
                            log.info("[prepare] FastAPI 스트림 완료");
                            synchronized (session.lock) {
                                session.streamComplete = true;
                                if (session.liveEmitter != null) {
                                    session.liveEmitter.complete();
                                    session.liveEmitter = null;
                                }
                            }
                        }
                );

        try {
            String fastApiSessionId = sessionIdFuture.get(PREPARE_SESSION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            bufferMap.put(fastApiSessionId, session);
            log.info("[prepare] 세션 준비 완료: {}", fastApiSessionId);
            return new PrepareResponse(fastApiSessionId);
        } catch (TimeoutException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "FastAPI 세션 초기화 타임아웃 (" + PREPARE_SESSION_TIMEOUT_SECONDS + "s)"
            );
        } catch (Exception e) {
            Throwable cause = e instanceof ExecutionException && e.getCause() != null ? e.getCause() : e;
            if (cause instanceof WebClientResponseException webClientError) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "FastAPI 오류: " + webClientError.getStatusCode()
                );
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "FastAPI 세션 초기화 실패: " + cause.getMessage()
            );
        }
    }

    private void handlePrepareEvent(
            ServerSentEvent<?> event,
            User user,
            Topic topic,
            DebateCreateRequest request,
            BufferedSession session,
            CompletableFuture<String> sessionIdFuture
    ) {
        try {
            String eventType = event.event();
            if (event.data() == null) return;

            DebateEvent debateEvent = objectMapper.convertValue(event.data(), DebateEvent.class);
            DebateEventResponse response;

            switch (eventType) {
                case "session":
                    DebateSession debateSession = DebateSession.builder()
                            .user(user)
                            .fastApiSessionId(debateEvent.getSessionId())
                            .topic(topic.getId())
                            .userStance(request.getUserStance())
                            .userIntensity(request.getUserIntensity())
                            .debateFormat(request.getDebateFormat())
                            .build();
                    DebateSession saved = debateSessionRepository.save(debateSession);
                    sessionIdMap.put(debateEvent.getSessionId(), saved.getId());

                    response = DebateEventResponse.fromSession(debateEvent);

                    // session 이벤트를 버퍼에 추가한 뒤 future 완료 → prepareDebate 반환
                    synchronized (session.lock) {
                        session.fastApiSessionId = debateEvent.getSessionId();
                        session.events.add(new BufferedEvent(eventType, response));
                    }
                    sessionIdFuture.complete(debateEvent.getSessionId());
                    return; // synchronized 블록 밖에서 이미 추가했으므로 아래 공통 블록 스킵

                case "turn":
                    response = DebateEventResponse.fromTurn(debateEvent);
                    log.info("[prepare] turn: speaker={} phase={}",
                            debateEvent.getEntry() != null ? debateEvent.getEntry().getSpeakerId() : null,
                            debateEvent.getEntry() != null ? debateEvent.getEntry().getPhase() : null);
                    if (session.fastApiSessionId != null) {
                        saveAgentUtterance(session.fastApiSessionId, debateEvent);
                    }
                    break;

                case "entry":
                    response = DebateEventResponse.fromEntry(debateEvent);
                    log.info("[prepare] entry(구): speaker={} phase={}", debateEvent.getSpeakerId(), debateEvent.getPhase());
                    if (session.fastApiSessionId != null) {
                        saveAgentUtterance(session.fastApiSessionId, debateEvent);
                    }
                    break;

                case "waiting":
                    response = DebateEventResponse.fromWaiting(debateEvent);
                    log.info("[prepare] waiting: waitingFor={}", debateEvent.getWaitingFor());
                    break;

                case "analysis":
                    response = DebateEventResponse.fromAnalysis(debateEvent);
                    log.info("[prepare] analysis(구): turnIndex={} pro={}% con={}%",
                            debateEvent.getTurnIndex(), debateEvent.getProPercent(), debateEvent.getConPercent());
                    break;

                default:
                    log.warn("[prepare] 알 수 없는 이벤트 타입: {}", eventType);
                    return;
            }

            // entry / waiting / analysis 이벤트: 버퍼에 추가 + live emitter 포워딩
            synchronized (session.lock) {
                session.events.add(new BufferedEvent(eventType, response));
                if (session.liveEmitter != null) {
                    try {
                        session.liveEmitter.send(SseEmitter.event().name(eventType).data(response));
                    } catch (Exception e) {
                        log.warn("[prepare] live emitter 전송 실패, 연결 해제");
                        session.liveEmitter = null;
                    }
                }
            }

        } catch (Exception e) {
            log.error("[prepare] 이벤트 처리 오류", e);
            sessionIdFuture.completeExceptionally(e);
        }
    }

    // ── 버퍼 replay + 실시간 스트리밍 ────────────────────────────────────────

    /**
     * GET /api/debates/{sessionId}/stream
     * prepare 로 쌓인 버퍼를 SSE 로 replay 하고, 아직 수신 중이면 실시간 포워딩.
     */
    public SseEmitter streamDebate(String fastApiSessionId) {
        SseEmitter emitter = new SseEmitter(0L);
        BufferedSession session = bufferMap.get(fastApiSessionId);

        if (session == null) {
            log.warn("[stream] 준비된 세션 없음: {}", fastApiSessionId);
            emitter.completeWithError(new RuntimeException("준비된 세션을 찾을 수 없습니다: " + fastApiSessionId));
            return emitter;
        }

        // 연결 유지용 heartbeat
        ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
        ScheduledFuture<?> heartbeat = heartbeatScheduler.scheduleAtFixedRate(() -> {
            try { emitter.send(SseEmitter.event().comment("keep-alive")); } catch (Exception ignored) {}
        }, 5, 15, TimeUnit.SECONDS);

        Runnable cleanup = () -> {
            heartbeat.cancel(true);
            heartbeatScheduler.shutdown();
        };

        synchronized (session.lock) {
            // 버퍼된 이벤트 순서대로 replay
            for (BufferedEvent buffered : session.events) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(buffered.getEventType())
                            .data(buffered.getData()));
                } catch (Exception e) {
                    log.error("[stream] replay 중 오류", e);
                    cleanup.run();
                    emitter.completeWithError(e);
                    return emitter;
                }
            }

            if (session.streamComplete) {
                // FastAPI 스트림이 이미 끝났으면 바로 완료
                cleanup.run();
                emitter.complete();
            } else {
                // 아직 수신 중 → live emitter 등록하여 이후 이벤트 포워딩
                session.liveEmitter = emitter;
            }
        }

        emitter.onCompletion(() -> {
            cleanup.run();
            synchronized (session.lock) {
                if (session.liveEmitter == emitter) session.liveEmitter = null;
            }
        });
        emitter.onTimeout(() -> {
            cleanup.run();
            synchronized (session.lock) {
                if (session.liveEmitter == emitter) session.liveEmitter = null;
            }
        });

        return emitter;
    }

    // ── 토론 생성 및 AI 입론 SSE 스트리밍 (prepare 없이 직접 호출 시 폴백) ──

    /**
     * POST /api/debates
     * prepare 를 거치지 않은 경우의 폴백. 기존 동작 유지.
     */
    public SseEmitter initDebate(Long userId, DebateCreateRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        User user = (userId != null)
                ? userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
                : getOrCreateTestUser();

        Topic topic = topicRepository.findByTitle(request.getTopic())
                .or(() -> topicRepository.findById(request.getTopic()))
                .orElseThrow(() -> new IllegalArgumentException("주제를 찾을 수 없습니다: " + request.getTopic()));

        FastApiDebateRequest fastApiRequest = FastApiDebateRequest.from(request, topic.getId());
        try {
            String jsonBody = objectMapper.writeValueAsString(fastApiRequest);
            log.info("FastAPI 요청 JSON: {}", jsonBody);
        } catch (Exception e) {
            log.error("JSON 직렬화 오류", e);
        }

        ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
        ScheduledFuture<?> heartbeat = heartbeatScheduler.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event().comment("keep-alive"));
            } catch (Exception ignored) {}
        }, 5, 15, TimeUnit.SECONDS);

        // sessionId를 캡처하기 위한 배열 (람다에서 사용)
        final String[] capturedSessionId = {null};

        Disposable disposable = webClient.post()
                .uri("/debate/init")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(fastApiRequest)
                .retrieve()
                .bodyToFlux(ServerSentEvent.class)
                .subscribe(
                        event -> handleInitEvent(emitter, event, user, topic, request, capturedSessionId),
                        error -> {
                            heartbeat.cancel(true);
                            heartbeatScheduler.shutdown();
                            log.error("SSE 스트리밍 오류", error);
                            emitter.completeWithError(error);
                        },
                        () -> {
                            heartbeat.cancel(true);
                            heartbeatScheduler.shutdown();
                            emitter.complete();
                        }
                );

        emitter.onCompletion(() -> { heartbeat.cancel(true); heartbeatScheduler.shutdown(); disposable.dispose(); });
        emitter.onTimeout(() -> { heartbeat.cancel(true); heartbeatScheduler.shutdown(); disposable.dispose(); });

        return emitter;
    }

    private void handleInitEvent(SseEmitter emitter, ServerSentEvent<?> event, User user, Topic topic, DebateCreateRequest request, String[] capturedSessionId) {
        try {
            String eventType = event.event();
            Object data = event.data();

            if (data == null) return;

            DebateEvent debateEvent = objectMapper.convertValue(data, DebateEvent.class);
            DebateEventResponse response;

            switch (eventType) {
                case "session":
                    DebateSession debateSession = DebateSession.builder()
                            .user(user)
                            .fastApiSessionId(debateEvent.getSessionId())
                            .topic(topic.getId())
                            .userStance(request.getUserStance())
                            .userIntensity(request.getUserIntensity())
                            .debateFormat(request.getDebateFormat())
                            .build();
                    DebateSession saved = debateSessionRepository.save(debateSession);
                    sessionIdMap.put(debateEvent.getSessionId(), saved.getId());
                    capturedSessionId[0] = debateEvent.getSessionId();

                    response = DebateEventResponse.fromSession(debateEvent);
                    break;
                case "turn":
                    response = DebateEventResponse.fromTurn(debateEvent);
                    if (capturedSessionId[0] != null) {
                        saveAgentUtterance(capturedSessionId[0], debateEvent);
                    }
                    break;
                case "entry":
                    response = DebateEventResponse.fromEntry(debateEvent);
                    if (capturedSessionId[0] != null) {
                        saveAgentUtterance(capturedSessionId[0], debateEvent);
                    }
                    break;
                case "waiting":
                    response = DebateEventResponse.fromWaiting(debateEvent);
                    break;
                case "analysis":
                    response = DebateEventResponse.fromAnalysis(debateEvent);
                    break;
                default:
                    log.warn("알 수 없는 이벤트 타입: {}", eventType);
                    return;
            }

            emitter.send(SseEmitter.event()
                    .name(eventType)
                    .data(response));

        } catch (Exception e) {
            log.error("이벤트 처리 오류", e);
            emitter.completeWithError(e);
        }
    }

    // ── 토론 상태 조회 ─────────────────────────────────────────────────────────

    public DebateStateResponse getState(String sessionId) {
        DebateStateResponse response = restTemplate.getForObject(
                fastApiUrl + "/debate/" + sessionId + "/state",
                DebateStateResponse.class
        );

        if (response == null) {
            throw new RuntimeException("FastAPI 서버 응답이 없습니다.");
        }

        return response;
    }

    // ── 사용자 입력 제출 및 AI 응답 SSE 스트리밍 ──────────────────────────────

    public SseEmitter submit(String sessionId, SubmitRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        // 사용자 발언 저장
        saveUserUtterance(sessionId, request.getContent());

        Map<String, Object> body = new HashMap<>();
        body.put("content", request.getContent());
        if (request.getTargetId() != null) {
            body.put("target_id", request.getTargetId());
        }

        Disposable disposable = webClient.post()
                .uri("/debate/" + sessionId + "/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(ServerSentEvent.class)
                .subscribe(
                        event -> handleSubmitEvent(emitter, event, sessionId),
                        error -> {
                            log.error("SSE 스트리밍 오류", error);
                            emitter.completeWithError(error);
                        },
                        emitter::complete
                );

        emitter.onCompletion(disposable::dispose);
        emitter.onTimeout(disposable::dispose);

        return emitter;
    }

    private void handleSubmitEvent(SseEmitter emitter, ServerSentEvent<?> event, String fastApiSessionId) {
        try {
            String eventType = event.event();
            Object data = event.data();

            if (data == null) return;

            DebateEvent debateEvent = objectMapper.convertValue(data, DebateEvent.class);
            DebateEventResponse response;

            switch (eventType) {
                case "turn":
                    response = DebateEventResponse.fromTurn(debateEvent);
                    log.info("[submit] turn: speaker={} stance={} phase={}",
                            debateEvent.getEntry() != null ? debateEvent.getEntry().getSpeakerId() : null,
                            debateEvent.getEntry() != null ? debateEvent.getEntry().getStance() : null,
                            debateEvent.getEntry() != null ? debateEvent.getEntry().getPhase() : null);
                    saveAgentUtterance(fastApiSessionId, debateEvent);
                    break;
                case "entry":
                    response = DebateEventResponse.fromEntry(debateEvent);
                    log.info("[submit] entry(구): speaker={} stance={} phase={}", debateEvent.getSpeakerId(), debateEvent.getStance(), debateEvent.getPhase());
                    saveAgentUtterance(fastApiSessionId, debateEvent);
                    break;
                case "waiting":
                    response = DebateEventResponse.fromWaiting(debateEvent);
                    log.info("[submit] waiting: waitingFor={} isFinished={}", debateEvent.getWaitingFor(), debateEvent.getIsFinished());
                    break;
                case "analysis":
                    response = DebateEventResponse.fromAnalysis(debateEvent);
                    log.info("[submit] analysis(구): turnIndex={} pro={}% con={}%",
                            debateEvent.getTurnIndex(), debateEvent.getProPercent(), debateEvent.getConPercent());
                    break;
                default:
                    log.warn("알 수 없는 이벤트 타입: {}", eventType);
                    return;
            }

            emitter.send(SseEmitter.event()
                    .name(eventType)
                    .data(response));

        } catch (Exception e) {
            log.error("이벤트 처리 오류", e);
            emitter.completeWithError(e);
        }
    }

    // ── 사용자 발언 저장 ─────────────────────────────────────────────────────────

    private void saveUserUtterance(String fastApiSessionId, String content) {
        try {
            // 현재 상태 조회
            DebateStateResponse state = getState(fastApiSessionId);
            String phase = state.getPhase();
            Integer turn = state.getCurrentTurn();

            // DebateSession 조회
            DebateSession session = debateSessionRepository.findByFastApiSessionId(fastApiSessionId)
                    .orElseThrow(() -> new IllegalArgumentException("세션을 찾을 수 없습니다: " + fastApiSessionId));

            // topic ID로 Topic 조회
            var topic = topicRepository.findById(session.getTopic())
                    .orElseThrow(() -> new IllegalArgumentException("주제를 찾을 수 없습니다: " + session.getTopic()));

            // 사용자 발언 저장
            UserUtterance utterance = UserUtterance.builder()
                    .user(session.getUser())
                    .session(session)
                    .topic(topic)
                    .turn(turn)
                    .stance(session.getUserStance())
                    .phase(phase)
                    .content(content)
                    .targetId(null)
                    .build();

            userUtteranceRepository.save(utterance);
            log.info("[submit] 사용자 발언 저장: userId={} topicId={} phase={} turn={}",
                    session.getUser().getId(), topic.getId(), phase, turn);

        } catch (Exception e) {
            log.error("[submit] 사용자 발언 저장 실패", e);
            // 저장 실패해도 토론 진행은 계속
        }
    }

    // ── 에이전트 발언 저장 ─────────────────────────────────────────────────────────

    private void saveAgentUtterance(String fastApiSessionId, DebateEvent debateEvent) {
        try {
            DebateEvent.TurnEntry entry = debateEvent.getEntry();
            String speakerId = entry != null ? entry.getSpeakerId() : debateEvent.getSpeakerId();
            if (speakerId == null || "user".equals(speakerId) || "사용자".equals(speakerId)) {
                return;
            }

            Integer turn = entry != null ? entry.getTurn() : debateEvent.getTurn();
            String stance = entry != null ? entry.getStance() : debateEvent.getStance();
            String phase = entry != null ? entry.getPhase() : debateEvent.getPhase();
            String content = entry != null ? entry.getContent() : debateEvent.getContent();
            String targetId = entry != null ? entry.getTargetId() : debateEvent.getTargetId();

            // DebateSession 조회
            DebateSession session = debateSessionRepository.findByFastApiSessionId(fastApiSessionId)
                    .orElseThrow(() -> new IllegalArgumentException("세션을 찾을 수 없습니다: " + fastApiSessionId));

            // Topic 조회
            var topic = topicRepository.findById(session.getTopic())
                    .orElseThrow(() -> new IllegalArgumentException("주제를 찾을 수 없습니다: " + session.getTopic()));

            // 에이전트 발언 저장
            AgentUtterance utterance = AgentUtterance.builder()
                    .agentId(speakerId)
                    .session(session)
                    .topic(topic)
                    .turn(turn)
                    .stance(stance)
                    .phase(phase)
                    .content(content)
                    .targetId(targetId)
                    .build();

            agentUtteranceRepository.save(utterance);
            log.info("[entry] 에이전트 발언 저장: agentId={} topicId={} phase={} turn={}",
                    speakerId, topic.getId(), phase, turn);

        } catch (Exception e) {
            log.error("[entry] 에이전트 발언 저장 실패", e);
            // 저장 실패해도 토론 진행은 계속
        }
    }

    // ── 최종 리포트 (swing turns 포함) ────────────────────────────────────────

    public Map<String, Object> getFinalReport(String sessionId) {
        log.info("[final-report] sessionId={} 요청", sessionId);
        try {
            return webClient.get()
                    .uri("/debate/" + sessionId + "/final-report")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[final-report] FastAPI 오류 status={}", e.getStatusCode());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버 오류: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("[final-report] 요청 실패", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버 연결 실패: " + e.getMessage());
        }
    }

    // ── 테스트 유저 ────────────────────────────────────────────────────────────

    private User getOrCreateTestUser() {
        return userRepository.findBySocialIdAndProvider(TEST_USER_SOCIAL_ID, Provider.GOOGLE)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .socialId(TEST_USER_SOCIAL_ID)
                                .provider(Provider.GOOGLE)
                                .email("test@test.com")
                                .nickname("테스트유저")
                                .build()
                ));
    }
}
