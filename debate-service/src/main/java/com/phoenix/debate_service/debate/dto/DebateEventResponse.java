package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DebateEventResponse {

    private String event;

    // session 이벤트
    private String sessionId;
    private String topic;

    // entry 이벤트
    private Integer turn;
    private String speakerId;
    private String stance;
    private String phase;
    private String content;
    private String targetId;

    // waiting 이벤트
    private String waitingFor;
    private Boolean isFinished;
    private Integer totalEntries;
    private String synthesisDraft;

    // turn_analysis 이벤트
    private Integer turnIndex;
    private Double argumentScore;
    private Double evidenceScore;
    private Double languageScore;

    // live_debate 이벤트
    private Double proPercent;
    private Double conPercent;

    // turn 이벤트 (새 포맷)
    private TurnEntry entry;
    private TurnAnalysis analysis;

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TurnEntry {
        private Integer turn;
        private String speakerId;
        private String stance;
        private String phase;
        private String content;
        private String targetId;
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TurnAnalysis {
        private Integer turnIndex;
        private String speakerId;
        private Double argumentScore;
        private Double evidenceScore;
        private Double languageScore;
        private Double proPercent;
        private Double conPercent;
    }

    public static DebateEventResponse fromTurn(DebateEvent event) {
        DebateEvent.TurnEntry e = event.getEntry();
        DebateEvent.TurnAnalysis a = event.getAnalysis();

        TurnEntry entry = (e != null) ? TurnEntry.builder()
                .turn(e.getTurn())
                .speakerId(e.getSpeakerId())
                .stance(e.getStance())
                .phase(e.getPhase())
                .content(e.getContent())
                .targetId(e.getTargetId())
                .build() : null;

        TurnAnalysis analysis = (a != null) ? TurnAnalysis.builder()
                .turnIndex(a.getTurnIndex())
                .speakerId(a.getSpeakerId())
                .argumentScore(a.getArgumentScore())
                .evidenceScore(a.getEvidenceScore())
                .languageScore(a.getLanguageScore())
                .proPercent(a.getProPercent())
                .conPercent(a.getConPercent())
                .build() : null;

        return DebateEventResponse.builder()
                .event("turn")
                .entry(entry)
                .analysis(analysis)
                .build();
    }

    public static DebateEventResponse fromSession(DebateEvent event) {
        return DebateEventResponse.builder()
                .event("session")
                .sessionId(event.getSessionId())
                .topic(event.getTopic())
                .build();
    }

    public static DebateEventResponse fromEntry(DebateEvent event) {
        return DebateEventResponse.builder()
                .event("entry")
                .turn(event.getTurn())
                .speakerId(event.getSpeakerId())
                .stance(event.getStance())
                .phase(event.getPhase())
                .content(event.getContent())
                .targetId(event.getTargetId())
                .build();
    }

    public static DebateEventResponse fromWaiting(DebateEvent event) {
        return DebateEventResponse.builder()
                .event("waiting")
                .sessionId(event.getSessionId())
                .waitingFor(event.getWaitingFor())
                .isFinished(event.getIsFinished())
                .phase(event.getPhase())
                .totalEntries(event.getTotalEntries())
                .synthesisDraft(event.getSynthesisDraft())
                .build();
    }

    public static DebateEventResponse fromAnalysis(DebateEvent event) {
        return DebateEventResponse.builder()
                .event("analysis")
                .turnIndex(event.getTurnIndex())
                .speakerId(event.getSpeakerId())
                .argumentScore(event.getArgumentScore())
                .evidenceScore(event.getEvidenceScore())
                .languageScore(event.getLanguageScore())
                .proPercent(event.getProPercent())
                .conPercent(event.getConPercent())
                .build();
    }
}
