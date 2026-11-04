package com.cyberbondhu.demo.vault;

import java.time.LocalDateTime;

/**
 * What the API sends back to the client. The password is still the
 * AES-encrypted text produced in the browser; the server never sees the plain one.
 */
public record VaultEntryResponse(
        Integer entryId,
        Integer userId,
        String siteName,
        String siteUrl,
        String accountUsername,
        String encryptedPassword,
        String iv,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static VaultEntryResponse from(VaultEntry e) {
        return new VaultEntryResponse(
                e.getEntryId(),
                e.getUserId(),
                e.getSiteName(),
                e.getSiteUrl(),
                e.getAccountUsername(),
                e.getEncryptedPassword(),
                e.getIv(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
