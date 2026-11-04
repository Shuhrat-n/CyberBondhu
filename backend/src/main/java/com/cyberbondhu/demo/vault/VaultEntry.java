package com.cyberbondhu.demo.vault;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vault_entries")
public class VaultEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Integer entryId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "site_name", nullable = false, length = 100)
    private String siteName;

    @Column(name = "site_url", nullable = false, length = 500)
    private String siteUrl;

    @Column(name = "account_username", nullable = false)
    private String accountUsername;

    // AES-encrypted in the browser; the server never sees the plain password
    @Column(name = "encrypted_password", nullable = false, columnDefinition = "TEXT")
    private String encryptedPassword;

    @Column(name = "iv", nullable = false, length = 32)
    private String iv;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getEntryId() { return entryId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public String getSiteUrl() { return siteUrl; }
    public void setSiteUrl(String siteUrl) { this.siteUrl = siteUrl; }
    public String getAccountUsername() { return accountUsername; }
    public void setAccountUsername(String accountUsername) { this.accountUsername = accountUsername; }
    public String getEncryptedPassword() { return encryptedPassword; }
    public void setEncryptedPassword(String encryptedPassword) { this.encryptedPassword = encryptedPassword; }
    public String getIv() { return iv; }
    public void setIv(String iv) { this.iv = iv; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
