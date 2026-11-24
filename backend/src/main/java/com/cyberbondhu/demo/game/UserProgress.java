package com.cyberbondhu.demo.game;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_progress")
public class UserProgress {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(name = "progress_id") 
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "scenario_id")
    private Long scenarioId;

    @Column(name = "choice_id")
    private Long choiceId;

    @Column(name = "is_safe_result") 
    private boolean correct;

    @Column(name = "attempted_at") 
    private LocalDateTime answeredAt = LocalDateTime.now();

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
    public LocalDateTime getAnsweredAt() { return answeredAt; }
}