package com.phoenix.debate_service.debate.domain;

import com.phoenix.debate_service.global.entity.BaseTimeEntity;
import com.phoenix.debate_service.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pre_post_answers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrePostAnswer extends BaseTimeEntity {

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

    @Column(name = "pre_pro", columnDefinition = "TEXT")
    private String prePro;

    @Column(name = "pre_con", columnDefinition = "TEXT")
    private String preCon;

    @Column(name = "post_pro", columnDefinition = "TEXT")
    private String postPro;

    @Column(name = "post_con", columnDefinition = "TEXT")
    private String postCon;

    @Builder
    public PrePostAnswer(User user, DebateSession session, String topicId,
                         String prePro, String preCon, String postPro, String postCon) {
        this.user = user;
        this.session = session;
        this.topicId = topicId;
        this.prePro = prePro;
        this.preCon = preCon;
        this.postPro = postPro;
        this.postCon = postCon;
    }

    public void updatePostAnswers(String postPro, String postCon) {
        this.postPro = postPro;
        this.postCon = postCon;
    }
}
