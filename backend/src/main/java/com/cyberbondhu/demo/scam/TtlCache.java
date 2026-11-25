package com.cyberbondhu.demo.scam;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class TtlCache<V> {
    private record Entry<V>(V value, long expiresAt) {}
    private final Map<String, Entry<V>> map = new ConcurrentHashMap<>();
    private final int maxSize;

    public TtlCache(int maxSize) { this.maxSize = maxSize; }

    public Optional<V> get(String key) {
        Entry<V> e = map.get(key);
        if (e == null) return Optional.empty();
        if (e.expiresAt() < System.currentTimeMillis()) { map.remove(key); return Optional.empty(); }
        return Optional.of(e.value());
    }

    public void put(String key, V value, Duration ttl) {
        if (map.size() >= maxSize) map.clear();
        map.put(key, new Entry<>(value, System.currentTimeMillis() + ttl.toMillis()));
    }
}