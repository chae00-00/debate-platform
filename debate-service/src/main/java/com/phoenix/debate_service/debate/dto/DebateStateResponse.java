package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class DebateStateResponse {

    @JsonProperty("session_id")
    private String sessionId;

    private String phase;

    @JsonProperty("current_turn")
    private Integer currentTurn;

    @JsonProperty("is_finished")
    private Boolean isFinished;

    @JsonProperty("waiting_for")
    private String waitingFor;

    @JsonProperty("debate_history")
    private List<DebateHistoryEntry> debateHistory;

    @JsonProperty("synthesis_draft")
    private String synthesisDraft;

    @Getter
    @NoArgsConstructor
    public static class DebateHistoryEntry {
        private Integer turn;

        @JsonProperty("speaker_id")
        private String speakerId;

        private String stance;

        private String phase;

        private String content;

        @JsonProperty("target_id")
        private String targetId;
    }
}
