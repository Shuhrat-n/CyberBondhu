// ScamDetectionService.java
package com.cyberbondhu.service;

import com.cyberbondhu.model.ScamResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ScamDetectionService {

    // Define rules, scores, and bilingual explanations
    private static final List<ScamRule> RULES = Arrays.asList(
        new ScamRule(
            "(?i)\\b(urgent|immediately|blocked|suspend|আজই|বন্ধ করে দেওয়া হবে|জরুরী)\\b",
            30,
            Map.of("en", "Creates a false sense of urgency or threat.", "bn", "আপনাকে ভয় দেখানোর বা তাড়াহুড়ো করার চেষ্টা করছে।")
        ),
        new ScamRule(
            "(?i)\\b(password|pin|otp|cvv|পাসওয়ার্ড|পিন|ওটিপি)\\b",
            40,
            Map.of("en", "Requests sensitive personal information.", "bn", "আপনার গোপন তথ্য (পাসওয়ার্ড বা পিন) জানতে চাচ্ছে।")
        ),
        new ScamRule(
            "(?i)\\b(lottery|won|prize|claim|লটারি|পুরস্কার|জিতেছেন)\\b",
            30,
            Map.of("en", "Offers a fake prize or money to trick you.", "bn", "আপনাকে নকল পুরস্কার বা টাকার লোভ দেখাচ্ছে।")
        ),
        new ScamRule(
            "(?i)(http://|bit\\.ly|tinyurl)",
            20,
            Map.of("en", "Contains an unsecure or hidden link.", "bn", "অনিরাপদ বা লুকানো লিংক পাঠানো হয়েছে।")
        )
    );

    public ScamResult analyzeText(String text) {
        ScamResult result = new ScamResult();
        int totalScore = 0;
        List> explanations = new ArrayList<>();
        List<String> matchedPhrases = new ArrayList<>();

        for (ScamRule rule : RULES) {
            Matcher matcher = Pattern.compile(rule.getPattern()).matcher(text);
            if (matcher.find()) {
                totalScore += rule.getRiskWeight();
                explanations.add(rule.getExplanation());
                matchedPhrases.add(matcher.group());
            }
        }

        result.setRiskScore(Math.min(totalScore, 100));
        result.setRiskLevel(determineRiskLevel(totalScore));
        result.setExplanations(explanations);
        result.setMatchedPhrases(matchedPhrases);

        return result;
    }

    private String determineRiskLevel(int score) {
        if (score >= 60) return "HIGH";
        if (score >= 30) return "MEDIUM";
        return "LOW";
    }

    // Inner class for Rule definition
    private static class ScamRule {
        private String pattern;
        private int riskWeight;
        private Map<String, String> explanation;

        public ScamRule(String pattern, int riskWeight, Map<String, String> explanation) {
            this.pattern = pattern;
            this.riskWeight = riskWeight;
            this.explanation = explanation;
        }
        public String getPattern() { return pattern; }
        public int getRiskWeight() { return riskWeight; }
        public Map<String, String> getExplanation() { return explanation; }
    }
}