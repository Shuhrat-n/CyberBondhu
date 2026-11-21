// ScamDetectionController.java
package com.cyberbondhu.controller;

import com.cyberbondhu.model.ScamResult;
import com.cyberbondhu.service.ScamDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scam-check")
@CrossOrigin(origins = "*") // Configure properly for production
public class ScamDetectionController {

    @Autowired
    private ScamDetectionService scamService;

    @PostMapping("/analyze")
    public ScamResult analyze(@RequestBody Map<String, String> request) {
        String text = request.getOrDefault("text", "");
        return scamService.analyzeText(text);
    }
}