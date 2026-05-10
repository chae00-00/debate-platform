package com.phoenix.debate_service.topic.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "topics")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Topic {

    @Id
    private String id;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String title;

    @Column(name = "description_short", columnDefinition = "TEXT")
    private String descriptionShort;

    @Column(name = "description_long", columnDefinition = "TEXT")
    private String descriptionLong;

    @Column(nullable = false)
    private String pro;

    @Column(nullable = false)
    private String con;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TopicReference> references = new ArrayList<>();

    @Builder
    public Topic(String id, String category, String title, String descriptionShort,
                 String descriptionLong, String pro, String con) {
        this.id = id;
        this.category = category;
        this.title = title;
        this.descriptionShort = descriptionShort;
        this.descriptionLong = descriptionLong;
        this.pro = pro;
        this.con = con;
    }

    public void addReference(TopicReference reference) {
        references.add(reference);
        reference.setTopic(this);
    }
}
