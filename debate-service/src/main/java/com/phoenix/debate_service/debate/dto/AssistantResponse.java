package com.phoenix.debate_service.debate.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AssistantResponse {
    private String sessionId;
    private String phase;
    private String text;
}
