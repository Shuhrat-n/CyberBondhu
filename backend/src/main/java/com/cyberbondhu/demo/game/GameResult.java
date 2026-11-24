package com.cyberbondhu.demo.game;

public record GameResult(
    boolean safe,
    String feedback,
    Long correctChoiceId,
    String correctChoiceText
) {}