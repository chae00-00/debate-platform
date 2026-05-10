package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationRequest {

    @JsonProperty("pre_pro")
    private String prePro;

    @JsonProperty("pre_con")
    private String preCon;

    @JsonProperty("post_pro")
    private String postPro;

    @JsonProperty("post_con")
    private String postCon;
}
