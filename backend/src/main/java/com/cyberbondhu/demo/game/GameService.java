package com.cyberbondhu.demo.game;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class GameService {

    // --- MOCK DATA (Replace with Database later) ---
    private final List<Scenario> mockScenarios = List.of(
        new Scenario(1, "Suspicious Bank Message", 
            "Dear customer, your bank account will be BLOCKED today. Click http://bit.ly/bnk-verify and enter your PIN to keep it active.",
            List.of(
                new Choice(1, "Click the link and enter my PIN", false),
                new Choice(2, "Ignore the message and call my bank", true),
                new Choice(3, "Reply with my account number", false)
            )
        ),
        new Scenario(2, "Lucky Draw Prize", 
            "Congratulations! You won 50,000 Taka in a lucky draw. Send a 500 Taka processing fee to claim your prize.",
            List.of(
                new Choice(4, "Send the 500 Taka fee", false),
                new Choice(5, "Delete the message", true),
                new Choice(6, "Forward it to my family", false)
            )
        )
    );

    // 1. Get all scenarios
    public List<Scenario> getAllScenarios() {
        return mockScenarios;
    }

    // 2. Check the user's answer
    public GameResult checkAnswer(GameSubmission submission) {
        Scenario scenario = mockScenarios.stream()
            .filter(s -> s.id() == submission.scenarioId())
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Scenario not found"));

        Choice selectedChoice = scenario.choices().stream()
            .filter(c -> c.id() == submission.choiceId())
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Choice not found"));

        if (selectedChoice.isSafe()) {
            return new GameResult(true, "Correct! That is the safest action to take.");
        } else {
            return new GameResult(false, "Careful! Scammers use tactics like this to steal your information. The safe choice was to verify the sender.");
        }
    }
}