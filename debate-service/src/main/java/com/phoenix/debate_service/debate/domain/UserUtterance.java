package com.phoenix.debate_service.debate.domain;

import com.phoenix.debate_service.global.entity.BaseTimeEntity;
import com.phoenix.debate_service.topic.domain.Topic;
import com.phoenix.debate_service.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_utterances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserUtterance extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private DebateSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(nullable = false)
    private Integer turn;

    @Column(nullable = false)
    private String stance;

    @Column(nullable = false)
    private String phase;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "target_id")
    private String targetId;

    @Builder
    public UserUtterance(User user, DebateSession session, Topic topic, Integer turn, String stance, String phase, String content, String targetId) {
        this.user = user;
        this.session = session;
        this.topic = topic;
        this.turn = turn;
        this.stance = stance;
        this.phase = phase;
        this.content = content;
        this.targetId = targetId;
    }
}
