package com.cyberbondhu.demo.game;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    // START: Get all scenarios
    @GetMapping("/start")
    public ResponseEntity<List<Scenario>> startGame() {
        return ResponseEntity.ok(gameService.getAllScenarios());
    }

    // SUBMIT: Send the user's choice and get feedback
    @PostMapping("/submit")
    public ResponseEntity<GameResult> submitAnswer(@RequestBody GameSubmission submission) {
        try {
            GameResult result = gameService.checkAnswer(submission);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}