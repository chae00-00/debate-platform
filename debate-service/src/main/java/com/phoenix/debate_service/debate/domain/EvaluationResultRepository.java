package com.phoenix.debate_service.debate.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluationResultRepository extends JpaRepository<EvaluationResult, Long> {
    Optional<EvaluationResult> findBySessionId(Long sessionId);
}
