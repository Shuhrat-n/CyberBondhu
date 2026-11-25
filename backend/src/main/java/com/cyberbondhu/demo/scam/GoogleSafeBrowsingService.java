package com.cyberbondhu.demo.scam;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GoogleSafeBrowsingService {
    public enum Verdict { SAFE, UNSAFE, UNKNOWN }

    private static final Logger log = LoggerFactory.getLogger(GoogleSafeBrowsingService.class);
    private static final String ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key={key}";

    private final RestTemplate rest;
    private final String apiKey;
    private final TtlCache<Verdict> cache = new TtlCache<>(5000);

    public GoogleSafeBrowsingService(@Value("${safebrowsing.api-key:}") String apiKey) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(2000);
        f.setReadTimeout(3000);
        this.rest = new RestTemplate(f);
        this.apiKey = apiKey;
    }

    public Verdict check(String url) {
        if (apiKey == null || apiKey.isBlank()) return Verdict.UNKNOWN;
        var cached = cache.get(url);
        if (cached.isPresent()) return cached.get();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
            "client", Map.of("clientId", "cyberbondhu", "clientVersion", "1.0"),
            "threatInfo", Map.of(
                "threatTypes", List.of("MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"),
                "platformTypes", List.of("ANY_PLATFORM"),
                "threatEntryTypes", List.of("URL"),
                "threatEntries", List.of(Map.of("url", url))));
        try {
            ResponseEntity<Map> res = rest.postForEntity(ENDPOINT, new HttpEntity<>(body, headers), Map.class, apiKey);
            boolean unsafe = res.getBody() != null && res.getBody().containsKey("matches");
            Verdict v = unsafe ? Verdict.UNSAFE : Verdict.SAFE;
            cache.put(url, v, unsafe ? Duration.ofHours(6) : Duration.ofMinutes(30));
            return v;
        } catch (Exception e) {
            log.warn("Safe Browsing lookup failed: {}", e.getClass().getSimpleName());
            return Verdict.UNKNOWN;
        }
    }
}