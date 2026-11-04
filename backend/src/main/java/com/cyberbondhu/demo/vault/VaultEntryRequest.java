package com.cyberbondhu.demo.vault;

public record VaultEntryRequest(
        Integer userId,
        String siteName,
        String siteUrl,
        String accountUsername,
        String encryptedPassword,
        String iv) {
}
