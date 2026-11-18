package com.cyberbondhu.demo.scam;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScamRules(
        Thresholds thresholds,
        Map<String, String> noWarningSigns,
        List<Category> categories,
        List<Combo> combos
) {
    public record Thresholds(int medium, int high) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Category(
            String id,
            int weight,
            Map<String, List<String>> keywords,
            List<String> patterns,
            Map<String, String> explanation
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Combo(
            List<String> categories,
            int bonus,
            Map<String, String> explanation
    ) {}
}