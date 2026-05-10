package com.phoenix.debate_service.debate.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DebateSessionRepository extends JpaRepository<DebateSession, Long> {

    List<DebateSession> findByUserId(Long userId);

    Optional<DebateSession> findByFastApiSessionId(String fastApiSessionId);
}
