package com.cyberbondhu.demo.scam;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@Service
public class VirusTotalService {
    public record VtResult(boolean found, int malicious, int suspicious, int harmless, int undetected) {
        static VtResult unknown() { return new VtResult(false, 0, 0, 0, 0); }
    }

    private static final Logger log = LoggerFactory.getLogger(VirusTotalService.class);

    private final RestTemplate rest;
    private final String apiKey;
    private final TtlCache<VtResult> cache = new TtlCache<>(5000);

    public VirusTotalService(@Value("${virustotal.api-key:}") String apiKey) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(2000);
        f.setReadTimeout(4000);
        this.rest = new RestTemplate(f);
        this.apiKey = apiKey;
    }

    public VtResult check(String url) {
        if (apiKey == null || apiKey.isBlank()) return VtResult.unknown();
        var cached = cache.get(url);
        if (cached.isPresent()) return cached.get();

        String id = Base64.getUrlEncoder().withoutPadding().encodeToString(url.getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", apiKey);

        try {
            ResponseEntity<Map> res = rest.exchange(
                "https://www.virustotal.com/api/v3/urls/{id}", HttpMethod.GET, new HttpEntity<>(headers), Map.class, id);
            Map<?, ?> stats = child(child(child(res.getBody(), "data"), "attributes"), "last_analysis_stats");
            if (stats == null) return VtResult.unknown();

            VtResult r = new VtResult(true, num(stats, "malicious"), num(stats, "suspicious"),
                                      num(stats, "harmless"), num(stats, "undetected"));
            if (r.malicious() + r.suspicious() + r.harmless() + r.undetected() == 0) return VtResult.unknown();
            cache.put(url, r, Duration.ofHours(6));
            return r;

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 404) {
                submit(url);
                cache.put(url, VtResult.unknown(), Duration.ofMinutes(5));
            } else if (e.getStatusCode().value() == 429) {
                cache.put(url, VtResult.unknown(), Duration.ofMinutes(1));
            }
            return VtResult.unknown();
        } catch (Exception e) {
            log.warn("VirusTotal lookup failed: {}", e.getClass().getSimpleName());
            return VtResult.unknown();
        }
    }

    private void submit(String url) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.set("x-apikey", apiKey);
            h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("url", url);
            rest.postForEntity("https://www.virustotal.com/api/v3/urls", new HttpEntity<>(form, h), String.class);
        } catch (Exception ignored) {}
    }

    private static Map<?, ?> child(Object o, String key) {
        return (o instanceof Map<?, ?> m && m.get(key) instanceof Map<?, ?> c) ? c : null;
    }

    private static int num(Map<?, ?> m, String key) {
        return m.get(key) instanceof Number n ? n.intValue() : 0;
    }
}