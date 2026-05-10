package com.phoenix.debate_service.topic.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, String> {

    List<Topic> findByCategory(String category);

    Optional<Topic> findByTitle(String title);
}
