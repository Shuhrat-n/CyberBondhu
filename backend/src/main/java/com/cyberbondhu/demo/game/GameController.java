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

    @GetMapping("/start")
    public List<ScenarioResponse> start(
            @RequestParam(defaultValue = "en") String lang,
            @RequestParam(defaultValue = "5") int limit) {
        return gameService.getScenarios(lang, limit);
    }

    @PostMapping("/submit")
    public GameResult submit(
            @RequestBody GameSubmission sub,
            @RequestParam(defaultValue = "en") String lang,
            Authentication auth) {
        
        // TODO: Replace with your actual UserDetails implementation
        // Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId(); 
        
        // For testing purposes, let's just use a hardcoded ID 
        // (We will fix this once we verify how AuthController passes the principal)
        Long userId = 1L; 
        
        return gameService.submit(userId, sub, lang);
    }

    @GetMapping("/progress")
    public ProgressSummary progress(Authentication auth) {
        // Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        Long userId = 1L;
        return gameService.getProgress(userId);
    }
}