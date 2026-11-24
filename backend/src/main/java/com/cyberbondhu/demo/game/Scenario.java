package com.cyberbondhu.demo.game;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenarios")
public class Scenario {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(name = "scenario_id")
    private Long id;
    
    @Column(name = "title_en") private String titleEn;
    @Column(name = "title_bn") private String titleBn;
    @Column(name = "message_en", length = 2000) private String messageEn;
    @Column(name = "message_bn", length = 2000) private String messageBn;
    @Column(name = "scenario_type") private String category;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    private List<ScenarioChoice> choices = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public String getTitleEn() { return titleEn; }
    public String getTitleBn() { return titleBn; }
    public String getMessageEn() { return messageEn; }
    public String getMessageBn() { return messageBn; }
    public String getCategory() { return category; }
    public List<ScenarioChoice> getChoices() { return choices; }
}