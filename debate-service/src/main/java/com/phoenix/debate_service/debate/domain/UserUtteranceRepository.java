package com.phoenix.debate_service.debate.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserUtteranceRepository extends JpaRepository<UserUtterance, Long> {

    List<UserUtterance> findByUserId(Long userId);

    List<UserUtterance> findByTopicId(String topicId);

    List<UserUtterance> findBySessionId(Long sessionId);

    List<UserUtterance> findByUserIdAndTopicId(Long userId, String topicId);

    List<UserUtterance> findByUserIdAndPhase(Long userId, String phase);
}
