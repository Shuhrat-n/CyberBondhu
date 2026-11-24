package com.cyberbondhu.demo.game;

import java.util.List;

public record ScenarioResponse(
    Long id,
    String title,
    String message,
    List<ChoiceResponse> choices
) {}