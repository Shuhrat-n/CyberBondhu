package com.cyberbondhu.demo.game;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final ScenarioRepository scenarios;
    private final UserProgressRepository progress;

    public GameService(ScenarioRepository scenarios, UserProgressRepository progress) {
        this.scenarios = scenarios;
        this.progress = progress;
    }

    // 1. GET Start (Shuffled, bilingual, no safe flag)
    @Transactional(readOnly = true)
    public List<ScenarioResponse> getScenarios(String lang, int limit) {
        boolean isBn = "bn".equalsIgnoreCase(lang);
        int n = Math.max(1, Math.min(limit, 20)); // Cap limit

        List<Scenario> all = new ArrayList<>(scenarios.findAll());
        Collections.shuffle(all); // Shuffle scenarios

        return all.stream().limit(n).map(s -> {
            List<ChoiceResponse> choices = s.getChoices().stream()
                .map(c -> new ChoiceResponse(c.getId(), isBn ? c.getTextBn() : c.getTextEn()))
                .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(choices); // Shuffle answers

            return new ScenarioResponse(
                s.getId(),
                isBn ? s.getTitleBn() : s.getTitleEn(),
                isBn ? s.getMessageBn() : s.getMessageEn(),
                choices
            );
        }).collect(Collectors.toList());
    }

    // 2. POST Submit
    @Transactional
    public GameResult submit(Long userId, GameSubmission sub, String lang) {
        // Null checks
        if (sub == null || sub.scenarioId() == null || sub.choiceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scenarioId and choiceId are required");
        }

        boolean isBn = "bn".equalsIgnoreCase(lang);

        Scenario s = scenarios.findById(sub.scenarioId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scenario not found"));

        ScenarioChoice picked = s.getChoices().stream()
            .filter(c -> c.getId().equals(sub.choiceId()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choice does not belong to this scenario"));

        ScenarioChoice safeChoice = s.getChoices().stream()
            .filter(ScenarioChoice::isSafe)
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Scenario has no safe choice"));

        // Save Progress
        UserProgress p = new UserProgress();
        p.setUserId(userId);
        p.setScenarioId(s.getId());
        p.setChoiceId(picked.getId());
        p.setCorrect(picked.isSafe());
        progress.save(p);

        // Return Result
        return new GameResult(
            picked.isSafe(),
            isBn ? picked.getFeedbackBn() : picked.getFeedbackEn(),
            safeChoice.getId(),
            isBn ? safeChoice.getTextBn() : safeChoice.getTextEn()
        );
    }

    // 3. GET Progress
    public ProgressSummary getProgress(Long userId) {
        long total = scenarios.count();
        long completed = progress.countDistinctScenarioByUserId(userId);
        long attempts = progress.countByUserId(userId);
        long correct = progress.countByUserIdAndCorrectTrue(userId);
        int pct = attempts == 0 ? 0 : (int) ((correct * 100) / attempts);

        return new ProgressSummary(total, completed, correct, attempts, pct);
    }
}