package com.cyberbondhu.demo.scam;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;

@Component
public class PhishingBlocklist {
    private static final Logger log = LoggerFactory.getLogger(PhishingBlocklist.class);
    private static final String FEED = "https://openphish.com/feed.txt";
    private static final Path CACHE = Path.of("data/openphish-cache.txt");
    private static final Path LOCAL = Path.of("data/local-blocklist.txt");

    // Shared platforms where a host match would be too broad
    private static final Set<String> SHARED_HOSTS = Set.of(
        "docs.google.com", "sites.google.com", "forms.gle", "github.io",
        "bit.ly", "tinyurl.com", "firebaseapp.com", "weebly.com", "wixsite.com");

    private volatile Set<String> urls = Set.of();
    private volatile Set<String> hosts = Set.of();
    private final RestTemplate rest;

    public PhishingBlocklist() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5000);   // ms
    f.setReadTimeout(15000);     // ms
    this.rest = new RestTemplate(f);
}

    @PostConstruct
    void loadCacheAtStartup() {
    try {
        String feed = Files.exists(CACHE) ? Files.readString(CACHE) : "";
        load(feed);   // load() appends data/local-blocklist.txt automatically
        log.info("Blocklist loaded at startup: {} URLs", urls.size());
    } catch (Exception e) {
        log.warn("Could not load blocklist at startup: {}", e.getMessage());
    }
}

    @Scheduled(initialDelay = 5_000, fixedRate = 24 * 60 * 60 * 1000)
    public void refresh() {
        try {
            String feed = rest.getForObject(FEED, String.class);
            if (feed == null || feed.isBlank()) return;
            load(feed);
            Files.createDirectories(CACHE.getParent());
            Files.writeString(CACHE, feed);
            log.info("Blocklist refreshed from OpenPhish: {} URLs", urls.size());
        } catch (Exception e) {
            log.warn("Blocklist refresh failed, keeping previous list: {}", e.getMessage());
        }
    }

    private void load(String feed) {
        // Append the local test list if it exists
        if (Files.exists(LOCAL)) {
            try {
                feed = feed + "\n" + Files.readString(LOCAL);
            } catch (Exception ignored) {}
        }

        Set<String> newUrls = new HashSet<>();
        Set<String> newHosts = new HashSet<>();
        
        for (String line : feed.split("\\R")) {
            String n = normalize(line);
            if (n == null) continue;
            newUrls.add(n);
            String h = hostOf(n);
            if (h != null && !SHARED_HOSTS.contains(h)) {
                newHosts.add(h);
            }
        }
        this.urls = newUrls;     // Swap only after fully built
        this.hosts = newHosts;
    }

    public boolean isListed(String url) {
        String n = normalize(url);
        if (n == null) return false;
        String h = hostOf(n);
        return urls.contains(n) || (h != null && hosts.contains(h));
    }

    private static String normalize(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;
        try {
            URI u = URI.create(s);
            if (u.getHost() == null) return null;
            String path = u.getRawPath() == null ? "" : u.getRawPath().replaceAll("/+$", "");
            String q = u.getRawQuery() == null ? "" : "?" + u.getRawQuery();
            return u.getScheme().toLowerCase() + "://" + u.getHost().toLowerCase() + path + q;
        } catch (Exception e) {
            return null;
        }
    }

    private static String hostOf(String normalized) {
        try { 
            return URI.create(normalized).getHost(); 
        } catch (Exception e) { 
            return null; 
        }
    }
}