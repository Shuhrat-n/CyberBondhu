package com.cyberbondhu.demo.scam;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Rule-based scam checker. All words, weights, thresholds and explanations live in
 * src/main/resources/scam/rules.json, so rules can be edited without touching Java.
 */
@Service
public class ScamRuleEngine {

    private static final String RULES_PATH = "scam/rules.json";
    private static final int MAX_PHRASES_PER_CATEGORY = 5;
    private static final int MAX_PHRASE_LENGTH = 80;

    // A "word boundary" that also works for Bangla (vowel signs are \p{M}, which \b mishandles).
    private static final String NOT_PRECEDED_BY_LETTER = "(?<![\\p{L}\\p{N}\\p{M}])";
    private static final String NOT_FOLLOWED_BY_LETTER = "(?![\\p{L}\\p{N}\\p{M}])";

    private record CompiledCategory(String id, int weight, Pattern pattern, Map<String, String> explanation) {}

    private final ScamRules rules;
    private final List<CompiledCategory> categories;

    public ScamRuleEngine() {
        this.rules = loadRules();
        this.categories = rules.categories().stream()
                .map(ScamRuleEngine::compile)
                .filter(c -> c.pattern() != null)
                .toList();
    }

    public ScamCheckResponse analyze(String text) {
        return analyze(text, "en");
    }

    public ScamCheckResponse analyze(String text, String lang) {
        String language = "bn".equalsIgnoreCase(lang) ? "bn" : "en";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFC);

        int score = 0;
        List<String> explanations = new ArrayList<>();
        Set<String> flagged = new LinkedHashSet<>();
        Set<String> hitCategories = new HashSet<>();

        for (CompiledCategory category : categories) {
            Set<String> matches = findMatches(category.pattern(), normalized);
            if (matches.isEmpty()) {
                continue;
            }
            hitCategories.add(category.id());
            score += category.weight(); // each category counts once, however many words match
            flagged.addAll(matches);    // but every matched phrase is reported
            explanations.add(render(category.explanation(), language, matches));
        }

        if (rules.combos() != null) {
            for (ScamRules.Combo combo : rules.combos()) {
                if (hitCategories.containsAll(combo.categories())) {
                    score += combo.bonus();
                    explanations.add(render(combo.explanation(), language, Set.of()));
                }
            }
        }

        if (explanations.isEmpty()) {
            explanations.add(pick(rules.noWarningSigns(), language));
        }

        return new ScamCheckResponse(riskFor(score), score, List.copyOf(explanations), List.copyOf(flagged));
    }

    private RiskLevel riskFor(int score) {
        if (score >= rules.thresholds().high()) return RiskLevel.HIGH;
        if (score >= rules.thresholds().medium()) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    // ---------- matching ----------

    private static Set<String> findMatches(Pattern pattern, String text) {
        Set<String> found = new LinkedHashSet<>();
        Matcher m = pattern.matcher(text);
        while (m.find() && found.size() < MAX_PHRASES_PER_CATEGORY) {
            String phrase = m.group().trim().replaceAll("[.,;:!?)\\]]+$", "");
            if (phrase.length() > MAX_PHRASE_LENGTH) {
                phrase = phrase.substring(0, MAX_PHRASE_LENGTH) + "…";
            }
            if (!phrase.isEmpty()) {
                found.add(phrase.toLowerCase(Locale.ROOT));
            }
        }
        return found;
    }

    /**
     * One regex per category. English keywords need a boundary on both sides ("pin" must not
     * match "shopping"). Bangla keywords only need one on the left, because Bangla attaches
     * suffixes to words (পুরস্কার -> পুরস্কারটি).
     */
    private static CompiledCategory compile(ScamRules.Category c) {
        List<String> alternatives = new ArrayList<>();

        if (c.keywords() != null) {
            c.keywords().forEach((lang, words) -> {
                if (words == null) return;
                String group = words.stream()
                        .filter(w -> w != null && !w.isBlank())
                        .map(w -> Normalizer.normalize(w.trim(), Normalizer.Form.NFC))
                        .sorted(Comparator.comparingInt(String::length).reversed()) // longest first
                        .map(Pattern::quote)
                        .collect(Collectors.joining("|"));
                if (group.isEmpty()) return;
                boolean bangla = "bn".equalsIgnoreCase(lang);
                alternatives.add(NOT_PRECEDED_BY_LETTER + "(?:" + group + ")"
                        + (bangla ? "" : NOT_FOLLOWED_BY_LETTER));
            });
        }
        if (c.patterns() != null) {
            c.patterns().forEach(p -> alternatives.add("(?:" + p + ")"));
        }

        Pattern pattern = alternatives.isEmpty()
                ? null
                : Pattern.compile(String.join("|", alternatives), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        return new CompiledCategory(c.id(), c.weight(), pattern, c.explanation());
    }

    // ---------- text ----------

    private static String render(Map<String, String> templates, String language, Set<String> matches) {
        return pick(templates, language).replace("{matches}", String.join(", ", matches));
    }

    private static String pick(Map<String, String> templates, String language) {
        if (templates == null) return "";
        String t = templates.get(language);
        return t != null ? t : templates.getOrDefault("en", "");
    }

    private static ScamRules loadRules() {
        try (InputStream in = ScamRuleEngine.class.getClassLoader().getResourceAsStream(RULES_PATH)) {
            if (in == null) {
                throw new IllegalStateException("Rules file not found on classpath: " + RULES_PATH);
            }
            ScamRules loaded = new ObjectMapper().readValue(in, ScamRules.class);
            if (loaded.thresholds() == null || loaded.categories() == null) {
                throw new IllegalStateException("rules.json must define 'thresholds' and 'categories'");
            }
            return loaded;
        } catch (IOException e) {
            throw new IllegalStateException("Could not read " + RULES_PATH, e);
        }
    }
}
