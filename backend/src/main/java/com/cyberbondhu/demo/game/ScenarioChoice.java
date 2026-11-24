package com.cyberbondhu.demo.game;

import jakarta.persistence.*;

@Entity
@Table(name = "scenario_choices")
public class ScenarioChoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "scenario_id")
    private Scenario scenario;

    private String textEn;
    private String textBn;
    private boolean safe; // Notice we use 'safe', not 'isSafe'
    
    @Column(length = 1000) private String feedbackEn;
    @Column(length = 1000) private String feedbackBn;

    // Getters and Setters
    public Long getId() { return id; }
    public Scenario getScenario() { return scenario; }
    public String getTextEn() { return textEn; }
    public String getTextBn() { return textBn; }
    public boolean isSafe() { return safe; }
    public String getFeedbackEn() { return feedbackEn; }
    public String getFeedbackBn() { return feedbackBn; }
}