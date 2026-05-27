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
        @JsonProperty("local_acceptability")
        private MetricScore localAcceptability;

        @JsonProperty("local_relevance")
        private MetricScore localRelevance;

        @JsonProperty("local_sufficiency")
        private MetricScore localSufficiency;

        @JsonProperty("clarity")
        private MetricScore clarity;

        @JsonProperty("appropriateness")
        private MetricScore appropriateness;

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
