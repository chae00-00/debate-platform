package com.phoenix.debate_service.debate.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentUtteranceRepository extends JpaRepository<AgentUtterance, Long> {

    List<AgentUtterance> findBySessionId(Long sessionId);

    List<AgentUtterance> findBySessionIdOrderByTurn(Long sessionId);

    List<AgentUtterance> findByAgentId(String agentId);

    List<AgentUtterance> findBySessionIdAndAgentId(Long sessionId, String agentId);

    List<AgentUtterance> findBySessionIdAndStance(Long sessionId, String stance);
}
