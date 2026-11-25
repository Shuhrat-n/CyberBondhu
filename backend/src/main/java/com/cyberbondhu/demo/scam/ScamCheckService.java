package com.cyberbondhu.demo.scam;

import com.cyberbondhu.demo.scam.GoogleSafeBrowsingService.Verdict;
import com.cyberbondhu.demo.scam.VirusTotalService.VtResult;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;

@Service
public class ScamCheckService {
    private static final Pattern URL = Pattern.compile("https?://[^\\s<>\"']+", Pattern.CASE_INSENSITIVE);
    private static final Pattern IPV4 = Pattern.compile("^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$");
    private static final int MAX_URLS = 3;

    private final ScamRuleEngine ruleEngine;
    private final PhishingBlocklist blocklist;
    private final GoogleSafeBrowsingService gsb;
    private final VirusTotalService vt;

    public ScamCheckService(ScamRuleEngine ruleEngine, PhishingBlocklist blocklist,
                            GoogleSafeBrowsingService gsb, VirusTotalService vt) {
        this.ruleEngine = ruleEngine;
        this.blocklist = blocklist;
        this.gsb = gsb;
        this.vt = vt;
    }

    public ScamCheckResponse check(String text, String lang) {
        boolean bn = "bn".equalsIgnoreCase(lang);

        // Layer 1: rule engine (pure, offline)
        ScamCheckResponse rules = ruleEngine.analyze(text, lang);
        List<String> urls = extractUrls(text);
        if (urls.isEmpty()) return rules;

        RiskLevel level = rules.riskLevel();
        List<String> notes = new ArrayList<>();
        boolean allClean = true, unverified = false;
        int checked = 0;

        for (String url : urls) {
            String host = hostOf(url);
            if (host == null || isPrivateHost(host)) continue;
            checked++;

            // Layer 2: local blocklist (absolute)
            if (blocklist.isListed(url)) {
                return high(rules, t(bn, "This link is on a known phishing list.",
                        "এই লিংকটি পরিচিত প্রতারণার তালিকায় আছে।"));
            }
            // Layer 2b: raw public IP address (absolute)
            if (IPV4.matcher(host).matches()) {
                return high(rules, t(bn, "This link uses a raw IP address instead of a website name, a common scammer trick.",
                        "এই লিংকে ওয়েবসাইটের নামের বদলে সরাসরি আইপি নম্বর ব্যবহার করা হয়েছে, প্রতারকরা প্রায়ই এটি করে।"));
            }

            // Layer 3: Google Safe Browsing (every link)
            Verdict g = gsb.check(url);
            if (g == Verdict.UNSAFE) {
               return high(rules, t(bn, "Google Safe Browsing has flagged this link as dangerous.",
            "Google Safe Browsing এই লিংকটিকে বিপজ্জনক হিসেবে চিহ্নিত করেছে।"));
            }

            // Layer 4: VirusTotal (only when rules found something, or Google couldn't answer)
            VtResult v = (rules.riskLevel() != RiskLevel.LOW || g == Verdict.UNKNOWN) ? vt.check(url) : null;
            boolean vtFound = v != null && v.found();

            if (vtFound && v.malicious() >= 3) {
                return high(rules, t(bn, v.malicious() + " VirusTotal security engines flagged this link as malicious.",
                        "VirusTotal-এর " + v.malicious() + "টি নিরাপত্তা ইঞ্জিন এই লিংকটিকে ক্ষতিকর বলেছে।"));
            }
            if (vtFound && (v.malicious() >= 1 || v.suspicious() >= 1)) {
                level = max(level, RiskLevel.MEDIUM);
                notes.add(t(bn, "Some VirusTotal security engines consider this link suspicious.",
                        "VirusTotal-এর কিছু নিরাপত্তা ইঞ্জিন এই লিংকটিকে সন্দেহজনক বলেছে।"));
            }

            boolean clean = g == Verdict.SAFE && vtFound
                    && v.malicious() == 0 && v.suspicious() == 0 && v.harmless() >= 10;
            if (!clean) allClean = false;
            if (g == Verdict.UNKNOWN && !vtFound) unverified = true;
        }

        if (checked == 0) return rules;

        // Keyword-only HIGH, but every external check is clean: cap at MEDIUM
        if (rules.riskLevel() == RiskLevel.HIGH && allClean) {
            level = RiskLevel.MEDIUM;
            notes.add(t(bn, "This link contains sensitive words, but no security engine flagged the site. Stay careful with PINs and OTPs.",
                    "এই লিংকে সংবেদনশীল শব্দ আছে, কিন্তু কোনো নিরাপত্তা ইঞ্জিন সাইটটিকে ক্ষতিকর বলেনি। তবুও পিন বা ওটিপি দেওয়ার আগে সতর্ক থাকুন।"));
        }
        if (unverified && level != RiskLevel.LOW) {
            notes.add(t(bn, "This link could not be checked online, so this result is based on our rules only.",
                    "এই লিংকটি অনলাইনে যাচাই করা যায়নি, তাই ফলাফল শুধু আমাদের নিয়মের ওপর ভিত্তি করে।"));
        }

        List<String> explanations = new ArrayList<>(notes);
        explanations.addAll(rules.explanations());
        return new ScamCheckResponse(level, rules.score(), List.copyOf(explanations),
                rules.flaggedPhrases(), !unverified);
    }

    private ScamCheckResponse high(ScamCheckResponse rules, String reason) {
        List<String> ex = new ArrayList<>();
        ex.add(reason);
        if (rules.riskLevel() != RiskLevel.LOW) ex.addAll(rules.explanations());
        return new ScamCheckResponse(RiskLevel.HIGH, Math.max(100, rules.score()),
                List.copyOf(ex), rules.flaggedPhrases(), true);
    }

    private static String t(boolean bn, String en, String bnText) { return bn ? bnText : en; }

    private static RiskLevel max(RiskLevel a, RiskLevel b) { return a.compareTo(b) >= 0 ? a : b; }

    private static List<String> extractUrls(String text) {
        return URL.matcher(text).results().map(MatchResult::group)
                .map(u -> u.replaceAll("[.,;:!?)\\]]+$", ""))
                .map(u -> u.contains("#") ? u.substring(0, u.indexOf('#')) : u)
                .distinct().limit(MAX_URLS).toList();
    }

    private static String hostOf(String url) {
        try { String h = URI.create(url).getHost(); return h == null ? null : h.toLowerCase(); }
        catch (Exception e) { return null; }
    }

    private static boolean isPrivateHost(String host) {
        if (host.equals("localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
        var m = IPV4.matcher(host);
        if (!m.matches()) return false;
        int a = Integer.parseInt(m.group(1)), b = Integer.parseInt(m.group(2));
        return a == 10 || a == 127 || a == 0 || (a == 192 && b == 168)
                || (a == 172 && b >= 16 && b <= 31) || (a == 169 && b == 254);
    }
}