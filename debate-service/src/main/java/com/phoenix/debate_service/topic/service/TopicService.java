package com.phoenix.debate_service.topic.service;

import com.phoenix.debate_service.topic.domain.Topic;
import com.phoenix.debate_service.topic.domain.TopicReference;
import com.phoenix.debate_service.topic.domain.TopicRepository;
import com.phoenix.debate_service.topic.dto.TopicsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final RestTemplate restTemplate;
    private final TopicRepository topicRepository;

    @Value("${fastapi.url}")
    private String fastApiUrl;

    @Transactional(readOnly = true)
    public TopicsResponse getTopics() {
        List<Topic> topics = topicRepository.findAll();

        var categories = topics.stream()
                .collect(Collectors.groupingBy(
                        Topic::getCategory,
                        Collectors.mapping(this::toDto, Collectors.toList())
                ));

        return TopicsResponse.builder()
                .categories(categories)
                .build();
    }

    @Transactional
    public void syncTopicsFromFastApi() {
        TopicsResponse response = restTemplate.getForObject(
                fastApiUrl + "/topics",
                TopicsResponse.class
        );

        if (response == null || response.getCategories() == null) {
            throw new RuntimeException("FastAPI 서버 응답이 없습니다.");
        }

        topicRepository.deleteAll();

        response.getCategories().forEach((category, dtos) -> {
            dtos.forEach(dto -> {
                Topic topic = Topic.builder()
                        .id(dto.getId())
                        .category(category)
                        .title(dto.getTitle())
                        .descriptionShort(dto.getDescriptionShort())
                        .descriptionLong(dto.getDescriptionLong())
                        .pro(dto.getPro())
                        .con(dto.getCon())
                        .build();

                if (dto.getReferences() != null) {
                    dto.getReferences().forEach(ref -> {
                        TopicReference reference = TopicReference.builder()
                                .title(ref.getTitle())
                                .url(ref.getUrl())
                                .build();
                        topic.addReference(reference);
                    });
                }

                topicRepository.save(topic);
            });
        });
    }

    private com.phoenix.debate_service.topic.dto.Topic toDto(Topic entity) {
        List<com.phoenix.debate_service.topic.dto.TopicReference> refs = entity.getReferences().stream()
                .map(ref -> com.phoenix.debate_service.topic.dto.TopicReference.builder()
                        .title(ref.getTitle())
                        .url(ref.getUrl())
                        .build())
                .collect(Collectors.toList());

        return com.phoenix.debate_service.topic.dto.Topic.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .descriptionShort(entity.getDescriptionShort())
                .descriptionLong(entity.getDescriptionLong())
                .pro(entity.getPro())
                .con(entity.getCon())
                .references(refs)
                .build();
    }
}
