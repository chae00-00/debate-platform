package com.phoenix.debate_service.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EvaluationResponse {

    @JsonProperty("topic_id")
    private String topicId;

    private String topic;

    @JsonProperty("pro_label")
    private String proLabel;

    @JsonProperty("con_label")
    private String conLabel;

    private SideResult pro;
    private SideResult con;

    @Getter
    @NoArgsConstructor
    public static class SideResult {
        private PhaseResult pre;
        private PhaseResult post;

        @JsonProperty("delta_100")
        private Double delta100;
    }

    @Getter
    @NoArgsConstructor
    public static class PhaseResult {
        @JsonProperty("evidence_expansion")
        private MetricScore evidenceExpansion;

        @JsonProperty("knowledge_specificity")
        private MetricScore knowledgeSpecificity;

        @JsonProperty("evidence_validity")
        private MetricScore evidenceValidity;

        @JsonProperty("reasoning_density")
        private MetricScore reasoningDensity;

        @JsonProperty("perspective_diversity")
        private MetricScore perspectiveDiversity;

        @JsonProperty("average_100")
        private Double average100;

        @JsonProperty("overall_summary")
        private String overallSummary;
    }

    @Getter
    @NoArgsConstructor
    public static class MetricScore {
        private String label;
        private Integer score;
        private String reason;
    }
}
