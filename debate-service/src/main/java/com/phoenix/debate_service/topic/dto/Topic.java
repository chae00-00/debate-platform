package com.phoenix.debate_service.topic.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Topic {

    private String id;
    private String title;

    @JsonProperty("description_short")
    private String descriptionShort;

    @JsonProperty("description_long")
    private String descriptionLong;

    private String pro;
    private String con;
    private List<TopicReference> references;
}
