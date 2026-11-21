// ScamResult.java
package com.cyberbondhu.model;

import java.util.List;
import java.util.Map;

public class ScamResult {
    private int riskScore; // e.g., 0 to 100
    private String riskLevel; // LOW, MEDIUM, HIGH
    private List> explanations; // Bilingual explanations
    private List<String> matchedPhrases; // The exact words that triggered the rule

    // Getters and Setters...
}