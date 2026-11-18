
package com.cyberbondhu.demo.vault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/vault")
public class VaultEntryController {

    private static final int MAX_SITE_NAME = 100;
    private static final int MAX_SITE_URL = 500;
    private static final int MAX_USERNAME = 255;
    private static final int MAX_IV = 32;
    private static final int MAX_SALT = 64;
    private static final int MAX_ENCRYPTED_PASSWORD = 20000;

    private final VaultEntryRepository repo;

    public VaultEntryController(VaultEntryRepository repo) {
        this.repo = repo;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<VaultEntryResponse> create(
            @RequestBody VaultEntryRequest req) {

        requireUserId(req.userId());

        VaultEntry entry = new VaultEntry();
        entry.setUserId(req.userId());

        apply(entry, req);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(VaultEntryResponse.from(repo.save(entry)));
    }

    // READ all entries belonging to a user
    @GetMapping("/user/{userId}")
    public List<VaultEntryResponse> getByUser(
            @PathVariable Integer userId) {

        requireUserId(userId);

        return repo.findByUserId(userId)
                .stream()
                .sorted(Comparator.comparing(
                        VaultEntry::getSiteName,
                        String.CASE_INSENSITIVE_ORDER))
                .map(VaultEntryResponse::from)
                .toList();
    }

    // READ one entry
    @GetMapping("/{entryId}")
    public VaultEntryResponse getOne(
            @PathVariable Integer entryId,
            @RequestParam Integer userId) {

        return VaultEntryResponse.from(
                findOwned(entryId, userId));
    }

    // UPDATE
    @PutMapping("/{entryId}")
    public VaultEntryResponse update(
            @PathVariable Integer entryId,
            @RequestBody VaultEntryRequest req) {

        VaultEntry entry = findOwned(entryId, req.userId());

        apply(entry, req);

        return VaultEntryResponse.from(repo.save(entry));
    }

    // DELETE
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer entryId,
            @RequestParam Integer userId) {

        repo.delete(findOwned(entryId, userId));

        return ResponseEntity.noContent().build();
    }

    // Find an entry only if it belongs to the supplied user
    private VaultEntry findOwned(Integer entryId, Integer userId) {

        requireUserId(userId);

        return repo.findByEntryIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vault entry not found"));
    }

    private void requireUserId(Integer userId) {

        if (userId == null || userId <= 0) {
            throw bad("A valid userId is required");
        }
    }

    // Validate and copy request data into the entity
    private void apply(VaultEntry entry, VaultEntryRequest req) {

        String siteName = trim(req.siteName());
        String siteUrl = trim(req.siteUrl());
        String username = trim(req.accountUsername());
        String encryptedPassword = trim(req.encryptedPassword());
        String salt = trim(req.salt());
        String iv = trim(req.iv());

        if (isBlank(siteName)
                || isBlank(siteUrl)
                || isBlank(username)
                || isBlank(encryptedPassword)
                || isBlank(salt)
                || isBlank(iv)) {

            throw bad(
                    "siteName, siteUrl, accountUsername, encryptedPassword, salt and iv are required");
        }

        if (siteName.length() > MAX_SITE_NAME) {
            throw bad("siteName is too long");
        }

        if (siteUrl.length() > MAX_SITE_URL) {
            throw bad("siteUrl is too long");
        }

        if (username.length() > MAX_USERNAME) {
            throw bad("accountUsername is too long");
        }

        if (salt.length() > MAX_SALT) {
            throw bad("salt is too long");
        }

        if (iv.length() > MAX_IV) {
            throw bad("iv is too long");
        }

        if (encryptedPassword.length() > MAX_ENCRYPTED_PASSWORD) {
            throw bad("encryptedPassword is too long");
        }

        entry.setSiteName(siteName);
        entry.setSiteUrl(siteUrl);
        entry.setAccountUsername(username);
        entry.setEncryptedPassword(encryptedPassword);
        entry.setSalt(salt);
        entry.setIv(iv);
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
