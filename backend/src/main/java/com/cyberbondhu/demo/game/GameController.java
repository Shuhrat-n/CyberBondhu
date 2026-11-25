package com.cyberbondhu.demo.game;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    // 1. Get shuffled scenarios and choices.
    // The response intentionally does not include whether a choice is safe.
    @GetMapping("/start")
    public List<ScenarioResponse> start(
            @RequestParam(defaultValue = "en") String lang,
            @RequestParam(defaultValue = "5") int limit) {
        return gameService.getScenarios(lang, limit);
    }

    // 2. Submit the selected answer and save the attempt.
    @PostMapping("/submit")
    public GameResult submit(
            @RequestBody GameSubmission submission,
            @RequestParam(defaultValue = "en") String lang,
            Authentication authentication) {

        // DEMO ONLY: Replace with the authenticated user's database ID
        // when the JWT principal/user mapping is completed.
        Long userId = 1L;

        return gameService.submit(userId, submission, lang);
    }

    // 3. Return progress for the dashboard.
    // Keep only ONE GET mapping for /progress.
    @GetMapping("/progress")
    public ProgressSummary progress(Authentication authentication) {

        // DEMO ONLY: Replace with the authenticated user's database ID
        // when the JWT principal/user mapping is completed.
        Long userId = 1L;

        return gameService.getProgress(userId);
    }
}