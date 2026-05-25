package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FastApiDebateRequest {

    private String topic;

    @JsonProperty("user_stance")
    private String userStance;

    @JsonProperty("user_intensity")
    private Integer userIntensity;

    @JsonProperty("agent_intensities")
    private List<Integer> agentIntensities;

    @JsonProperty("debate_format")
    private String debateFormat;

    private String mode;  // "debate" | "constructive", 선택

    public static FastApiDebateRequest from(DebateCreateRequest request, String topicId) {
        return FastApiDebateRequest.builder()
                .topic(topicId)
                .userStance(request.getUserStance())
                .userIntensity(request.getUserIntensity())
                .agentIntensities(request.getAgentIntensities())
                .debateFormat(request.getDebateFormat())
                .mode(request.getMode())
                .build();
    }
}
