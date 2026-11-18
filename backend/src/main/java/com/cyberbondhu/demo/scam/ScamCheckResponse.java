package com.cyberbondhu.demo.scam;

import java.util.List;

public record ScamCheckResponse(
        RiskLevel riskLevel,
        int score,
        List<String> explanations,
        List<String> flaggedPhrases
) {}