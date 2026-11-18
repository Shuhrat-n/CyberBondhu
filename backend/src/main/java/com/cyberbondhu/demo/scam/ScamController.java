package com.cyberbondhu.demo.scam;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scam")
public class ScamController {

    private static final int MAX_MESSAGE_LENGTH = 5000;

    private final ScamRuleEngine ruleEngine;

    public ScamController(ScamRuleEngine ruleEngine) {
        this.ruleEngine = ruleEngine;
    }

    @PostMapping("/check")
    public ResponseEntity<ScamCheckResponse> checkMessage(@RequestBody ScamCheckRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()
                || request.message().length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ruleEngine.analyze(request.message(), request.lang()));
    }
}
