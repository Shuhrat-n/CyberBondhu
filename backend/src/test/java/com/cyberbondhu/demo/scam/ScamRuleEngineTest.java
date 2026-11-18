package com.cyberbondhu.demo.scam;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScamRuleEngineTest {

    private final ScamRuleEngine engine = new ScamRuleEngine();

    @Test
    void wordBoundaryPreventsFalsePositives() {
        ScamCheckResponse r = engine.analyze("I love shopping and pinning recipes, won't be late");
        assertEquals(RiskLevel.LOW, r.riskLevel());
        assertTrue(r.flaggedPhrases().isEmpty());
    }

    @Test
    void normalTransactionMessageIsLow() {
        ScamCheckResponse r = engine.analyze("Received 500 taka from your friend via bKash");
        assertEquals(RiskLevel.LOW, r.riskLevel());
    }

    @Test
    void urgencyPlusOtpIsHigh() {
        ScamCheckResponse r = engine.analyze("Your account will be blocked. Send your OTP immediately.");
        assertEquals(RiskLevel.HIGH, r.riskLevel());
        assertTrue(r.flaggedPhrases().contains("otp"));
        assertTrue(r.flaggedPhrases().contains("blocked"));
        assertTrue(r.flaggedPhrases().contains("immediately"));
    }

    @Test
    void sensitiveRequestWithLinkIsHigh() {
        ScamCheckResponse r = engine.analyze("Verify your password at http://abc.xyz/login");
        assertEquals(RiskLevel.HIGH, r.riskLevel());
    }

    @Test
    void shortenedLinkIsFlagged() {
        ScamCheckResponse r = engine.analyze("Claim your reward https://bit.ly/3abcd");
        assertTrue(r.score() >= 5);
    }

    @Test
    void banglaScamIsDetected() {
        ScamCheckResponse r = engine.analyze("আপনার বিকাশ অ্যাকাউন্ট বন্ধ হয়ে যাবে। এখনই আপনার পিন দিন", "bn");
        assertEquals(RiskLevel.HIGH, r.riskLevel());
        assertTrue(r.flaggedPhrases().contains("পিন"));
    }

    @Test
    void banglaSuffixStillMatches() {
        ScamCheckResponse r = engine.analyze("আপনি একটি পুরস্কারটি জিতেছেন");
        assertTrue(r.flaggedPhrases().stream().anyMatch(p -> p.startsWith("পুরস্কার")));
    }

    @Test
    void explanationsFollowRequestedLanguage() {
        ScamCheckResponse bn = engine.analyze("Act now, urgent!", "bn");
        ScamCheckResponse en = engine.analyze("Act now, urgent!", "en");
        assertTrue(bn.explanations().get(0).contains("তাড়াহুড়ো"));
        assertTrue(en.explanations().get(0).contains("urgent language"));
    }
}
