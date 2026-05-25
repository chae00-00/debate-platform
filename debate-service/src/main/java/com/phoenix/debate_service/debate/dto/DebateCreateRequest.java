package com.phoenix.debate_service.debate.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class DebateCreateRequest {

    private String topic;
    private String userStance;
    private Integer userIntensity;
    private List<Integer> agentIntensities;
    private String debateFormat;
    private Integer maxCycle;
    private String mode;  // "debate" | "constructive", 선택 (기본값: constructive)
}
