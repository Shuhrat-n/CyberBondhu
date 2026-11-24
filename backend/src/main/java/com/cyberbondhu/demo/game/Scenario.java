package com.cyberbondhu.demo.game;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenarios")
public class Scenario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;
    
    private String titleEn;
    private String titleBn;
    
    @Column(length = 2000) private String messageEn;
    @Column(length = 2000) private String messageBn;
    
    private String category;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ScenarioChoice> choices = new ArrayList<>();

    // Getters and Setters (Generate with VS Code: Right-click -> Source Action -> Generate Getters and Setters)
    public Long getId() { return id; }
    public String getTitleEn() { return titleEn; }
    public String getTitleBn() { return titleBn; }
    public String getMessageEn() { return messageEn; }
    public String getMessageBn() { return messageBn; }
    public String getCategory() { return category; }
    public List<ScenarioChoice> getChoices() { return choices; }
}