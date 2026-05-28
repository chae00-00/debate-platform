package com.phoenix.debate_service.debate.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrePostAnswerRepository extends JpaRepository<PrePostAnswer, Long> {
    Optional<PrePostAnswer> findBySessionId(Long sessionId);
}
