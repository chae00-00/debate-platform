package com.phoenix.debate_service.debate.domain;

import com.phoenix.debate_service.global.entity.BaseTimeEntity;
import com.phoenix.debate_service.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "debate_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DebateSession extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "fast_api_session_id", nullable = false)
    private String fastApiSessionId;

    @Column(nullable = false)
    private String topic;

    @Column(name = "user_stance", nullable = false)
    private String userStance;

    @Column(name = "user_intensity", nullable = false)
    private Integer userIntensity;

    @Column(name = "debate_format", nullable = false)
    private String debateFormat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DebateStatus status;

    @Builder
    public DebateSession(User user, String fastApiSessionId, String topic,
                         String userStance, Integer userIntensity,
                         String debateFormat) {
        this.user = user;
        this.fastApiSessionId = fastApiSessionId;
        this.topic = topic;
        this.userStance = userStance;
        this.userIntensity = userIntensity;
        this.debateFormat = debateFormat;
        this.status = DebateStatus.ACTIVE;
    }

    public void updateStatus(DebateStatus status) {
        this.status = status;
    }
}
