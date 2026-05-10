package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DebateEvent {

    // session 이벤트
    @JsonProperty("session_id")
    private String sessionId;

    private String topic;

    // entry 이벤트
    private Integer turn;

    @JsonProperty("speaker_id")
    private String speakerId;

    private String stance;

    private String phase;

    private String content;

    @JsonProperty("target_id")
    private String targetId;

    // waiting 이벤트
    @JsonProperty("waiting_for")
    private String waitingFor;

    @JsonProperty("is_finished")
    private Boolean isFinished;

    @JsonProperty("total_entries")
    private Integer totalEntries;

    @JsonProperty("synthesis_draft")
    private String synthesisDraft;

    // turn_analysis 이벤트 (구 포맷 — 하위 호환)
    @JsonProperty("turn_index")
    private Integer turnIndex;

    @JsonProperty("argument_score")
    private Double argumentScore;

    @JsonProperty("evidence_score")
    private Double evidenceScore;

    @JsonProperty("language_score")
    private Double languageScore;

    // live_debate 이벤트 (구 포맷 — 하위 호환)
    @JsonProperty("pro_percent")
    private Double proPercent;

    @JsonProperty("con_percent")
    private Double conPercent;

    // turn 이벤트 (새 포맷 — entry + analysis 통합)
    private TurnEntry entry;
    private TurnAnalysis analysis;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TurnEntry {
        private Integer turn;
        @JsonProperty("speaker_id") private String speakerId;
        private String stance;
        private String phase;
        private String content;
        @JsonProperty("target_id") private String targetId;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TurnAnalysis {
        @JsonProperty("turn_index") private Integer turnIndex;
        @JsonProperty("speaker_id") private String speakerId;
        @JsonProperty("argument_score") private Double argumentScore;
        @JsonProperty("evidence_score") private Double evidenceScore;
        @JsonProperty("language_score") private Double languageScore;
        @JsonProperty("pro_percent") private Double proPercent;
        @JsonProperty("con_percent") private Double conPercent;
    }
}
