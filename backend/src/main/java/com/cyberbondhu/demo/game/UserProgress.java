package com.cyberbondhu.demo.game;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_progress")
public class UserProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    private Long userId;
    private Long scenarioId;
    private Long choiceId;
    private boolean correct;
    private Instant answeredAt = Instant.now();

    // Getters and Setters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getScenarioId() { return scenarioId; }
    public void setScenarioId(Long scenarioId) { this.scenarioId = scenarioId; }
    public Long getChoiceId() { return choiceId; }
    public void setChoiceId(Long choiceId) { this.choiceId = choiceId; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
    public Instant getAnsweredAt() { return answeredAt; }
}