
package com.cyberbondhu.demo.vault;

import java.time.LocalDateTime;

public record VaultEntryResponse(
        Integer entryId,
        Integer userId,
        String siteName,
        String siteUrl,
        String accountUsername,
        String encryptedPassword,
        String salt,
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
                e.getSalt(),
                e.getIv(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
