package com.phoenix.debate_service.topic.controller;

import com.phoenix.debate_service.topic.dto.TopicsResponse;
import com.phoenix.debate_service.topic.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<TopicsResponse> getTopics() {
        TopicsResponse response = topicService.getTopics();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncTopics() {
        topicService.syncTopicsFromFastApi();
        return ResponseEntity.ok("주제 동기화 완료");
    }
}
