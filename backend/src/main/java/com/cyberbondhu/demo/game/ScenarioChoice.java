package com.cyberbondhu.demo.game;

import jakarta.persistence.*;

@Entity
@Table(name = "scenario_choices")
public class ScenarioChoice {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(name = "choice_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "scenario_id")
    private Scenario scenario;

    @Column(name = "choice_text_en") private String textEn;
    @Column(name = "choice_text_bn") private String textBn;
    @Column(name = "is_safe") private boolean safe;
    @Column(name = "feedback_en", length = 1000) private String feedbackEn;
    @Column(name = "feedback_bn", length = 1000) private String feedbackBn;

    // Getters and Setters
    public Long getId() { return id; }
    public Scenario getScenario() { return scenario; }
    public String getTextEn() { return textEn; }
    public String getTextBn() { return textBn; }
    public boolean isSafe() { return safe; }
    public String getFeedbackEn() { return feedbackEn; }
    public String getFeedbackBn() { return feedbackBn; }
}