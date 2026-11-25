package com.cyberbondhu.demo.scam;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scam")
public class ScamController {

    private static final int MAX_MESSAGE_LENGTH = 5000;
    private final ScamCheckService checkService;

    public ScamController(ScamCheckService checkService) {
        this.checkService = checkService;
    }

    @PostMapping("/check")
    public ResponseEntity<ScamCheckResponse> checkMessage(@RequestBody ScamCheckRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()
                || request.message().length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(checkService.check(request.message(), request.lang()));
    }
}