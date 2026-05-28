package com.phoenix.debate_service.debate.domain;

import com.phoenix.debate_service.global.entity.BaseTimeEntity;
import com.phoenix.debate_service.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "evaluation_results")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EvaluationResult extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private DebateSession session;

    @Column(name = "topic_id", nullable = false)
    private String topicId;

    // 찬성 사전 점수
    @Column(name = "pro_pre_acceptability")
    private Integer proPreAcceptability;

    @Column(name = "pro_pre_relevance")
    private Integer proPreRelevance;

    @Column(name = "pro_pre_sufficiency")
    private Integer proPreSufficiency;

    @Column(name = "pro_pre_clarity")
    private Integer proPreClarity;

    @Column(name = "pro_pre_appropriateness")
    private Integer proPreAppropriateness;

    @Column(name = "pro_pre_average")
    private Double proPreAverage;

    // 찬성 사후 점수
    @Column(name = "pro_post_acceptability")
    private Integer proPostAcceptability;

    @Column(name = "pro_post_relevance")
    private Integer proPostRelevance;

    @Column(name = "pro_post_sufficiency")
    private Integer proPostSufficiency;

    @Column(name = "pro_post_clarity")
    private Integer proPostClarity;

    @Column(name = "pro_post_appropriateness")
    private Integer proPostAppropriateness;

    @Column(name = "pro_post_average")
    private Double proPostAverage;

    @Column(name = "pro_delta")
    private Double proDelta;

    // 반대 사전 점수
    @Column(name = "con_pre_acceptability")
    private Integer conPreAcceptability;

    @Column(name = "con_pre_relevance")
    private Integer conPreRelevance;

    @Column(name = "con_pre_sufficiency")
    private Integer conPreSufficiency;

    @Column(name = "con_pre_clarity")
    private Integer conPreClarity;

    @Column(name = "con_pre_appropriateness")
    private Integer conPreAppropriateness;

    @Column(name = "con_pre_average")
    private Double conPreAverage;

    // 반대 사후 점수
    @Column(name = "con_post_acceptability")
    private Integer conPostAcceptability;

    @Column(name = "con_post_relevance")
    private Integer conPostRelevance;

    @Column(name = "con_post_sufficiency")
    private Integer conPostSufficiency;

    @Column(name = "con_post_clarity")
    private Integer conPostClarity;

    @Column(name = "con_post_appropriateness")
    private Integer conPostAppropriateness;

    @Column(name = "con_post_average")
    private Double conPostAverage;

    @Column(name = "con_delta")
    private Double conDelta;

    // 요약
    @Column(name = "pro_pre_summary", columnDefinition = "TEXT")
    private String proPreSummary;

    @Column(name = "pro_post_summary", columnDefinition = "TEXT")
    private String proPostSummary;

    @Column(name = "con_pre_summary", columnDefinition = "TEXT")
    private String conPreSummary;

    @Column(name = "con_post_summary", columnDefinition = "TEXT")
    private String conPostSummary;

    @Builder
    public EvaluationResult(User user, DebateSession session, String topicId,
                            Integer proPreAcceptability, Integer proPreRelevance, Integer proPreSufficiency,
                            Integer proPreClarity, Integer proPreAppropriateness, Double proPreAverage,
                            Integer proPostAcceptability, Integer proPostRelevance, Integer proPostSufficiency,
                            Integer proPostClarity, Integer proPostAppropriateness, Double proPostAverage, Double proDelta,
                            Integer conPreAcceptability, Integer conPreRelevance, Integer conPreSufficiency,
                            Integer conPreClarity, Integer conPreAppropriateness, Double conPreAverage,
                            Integer conPostAcceptability, Integer conPostRelevance, Integer conPostSufficiency,
                            Integer conPostClarity, Integer conPostAppropriateness, Double conPostAverage, Double conDelta,
                            String proPreSummary, String proPostSummary, String conPreSummary, String conPostSummary) {
        this.user = user;
        this.session = session;
        this.topicId = topicId;
        this.proPreAcceptability = proPreAcceptability;
        this.proPreRelevance = proPreRelevance;
        this.proPreSufficiency = proPreSufficiency;
        this.proPreClarity = proPreClarity;
        this.proPreAppropriateness = proPreAppropriateness;
        this.proPreAverage = proPreAverage;
        this.proPostAcceptability = proPostAcceptability;
        this.proPostRelevance = proPostRelevance;
        this.proPostSufficiency = proPostSufficiency;
        this.proPostClarity = proPostClarity;
        this.proPostAppropriateness = proPostAppropriateness;
        this.proPostAverage = proPostAverage;
        this.proDelta = proDelta;
        this.conPreAcceptability = conPreAcceptability;
        this.conPreRelevance = conPreRelevance;
        this.conPreSufficiency = conPreSufficiency;
        this.conPreClarity = conPreClarity;
        this.conPreAppropriateness = conPreAppropriateness;
        this.conPreAverage = conPreAverage;
        this.conPostAcceptability = conPostAcceptability;
        this.conPostRelevance = conPostRelevance;
        this.conPostSufficiency = conPostSufficiency;
        this.conPostClarity = conPostClarity;
        this.conPostAppropriateness = conPostAppropriateness;
        this.conPostAverage = conPostAverage;
        this.conDelta = conDelta;
        this.proPreSummary = proPreSummary;
        this.proPostSummary = proPostSummary;
        this.conPreSummary = conPreSummary;
        this.conPostSummary = conPostSummary;
    }
}
