package com.cyberbondhu.demo.game;

import java.util.List;

public record Scenario(
    int id,
    String title,
    String message, // The fake SMS/Email they need to read
    List<Choice> choices
) {}