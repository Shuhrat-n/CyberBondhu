package com.cyberbondhu.demo.game;

public record ProgressSummary(
    long totalScenarios,
    long completedScenarios,
    long correctAnswers,
    long totalAttempts,
    int safetyPercent
) {}