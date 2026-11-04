package com.cyberbondhu.demo.vault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Vault CRUD REST API.
 *
 * POST   /api/vault                      create an entry               (body: VaultEntryRequest)
 * GET    /api/vault/user/{userId}        list all entries of a user
 * GET    /api/vault/{entryId}?userId=    read one entry
 * PUT    /api/vault/{entryId}            update an entry               (body: VaultEntryRequest)
 * DELETE /api/vault/{entryId}?userId=    delete an entry
 *
 * Every operation on a single entry requires the userId of its owner, and an entry
 * that belongs to someone else is reported as 404. Until login is connected to this
 * API, the userId is supplied by the client; once login issues a token, take the
 * userId from the authenticated user instead of from the request.
 *
 * The password is stored exactly as received: it is AES-encrypted in the browser,
 * so the server never sees the plain password.
 */
@RestController
@RequestMapping("/api/vault")
public class VaultEntryController {

    private static final int MAX_SITE_NAME = 100;
    private static final int MAX_SITE_URL = 500;
    private static final int MAX_USERNAME = 255;
    private static final int MAX_IV = 32;
    private static final int MAX_ENCRYPTED_PASSWORD = 20_000;

    private final VaultEntryRepository repo;

    public VaultEntryController(VaultEntryRepository repo) {
        this.repo = repo;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<VaultEntryResponse> create(@RequestBody VaultEntryRequest req) {
        requireUserId(req.userId());
        VaultEntry entry = new VaultEntry();
        entry.setUserId(req.userId());
        apply(entry, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(VaultEntryResponse.from(repo.save(entry)));
    }

    // READ all entries of one user (sorted by site name)
    @GetMapping("/user/{userId}")
    public List<VaultEntryResponse> getByUser(@PathVariable Integer userId) {
        requireUserId(userId);
        return repo.findByUserId(userId).stream()
                .sorted(Comparator.comparing(VaultEntry::getSiteName, String.CASE_INSENSITIVE_ORDER))
                .map(VaultEntryResponse::from)
                .toList();
    }

    // READ one entry
    @GetMapping("/{entryId}")
    public VaultEntryResponse getOne(@PathVariable Integer entryId, @RequestParam Integer userId) {
        return VaultEntryResponse.from(findOwned(entryId, userId));
    }

    // UPDATE (the owner of an entry cannot be changed)
    @PutMapping("/{entryId}")
    public VaultEntryResponse update(@PathVariable Integer entryId, @RequestBody VaultEntryRequest req) {
        VaultEntry entry = findOwned(entryId, req.userId());
        apply(entry, req);
        return VaultEntryResponse.from(repo.save(entry));
    }

    // DELETE
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> delete(@PathVariable Integer entryId, @RequestParam Integer userId) {
        repo.delete(findOwned(entryId, userId));
        return ResponseEntity.noContent().build();
    }

    // ---------- helpers ----------

    private VaultEntry findOwned(Integer entryId, Integer userId) {
        requireUserId(userId);
        return repo.findByEntryIdAndUserId(entryId, userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Vault entry not found"));
    }

    private void requireUserId(Integer userId) {
        if (userId == null || userId <= 0) {
            throw bad("A valid userId is required");
        }
    }

    private void apply(VaultEntry entry, VaultEntryRequest req) {
        String siteName = trim(req.siteName());
        String siteUrl = trim(req.siteUrl());
        String username = trim(req.accountUsername());

        if (isBlank(siteName) || isBlank(siteUrl) || isBlank(username)
                || isBlank(req.encryptedPassword()) || isBlank(req.iv())) {
            throw bad("siteName, siteUrl, accountUsername, encryptedPassword and iv are required");
        }
        if (siteName.length() > MAX_SITE_NAME) {
            throw bad("siteName must be at most " + MAX_SITE_NAME + " characters");
        }
        if (siteUrl.length() > MAX_SITE_URL) {
            throw bad("siteUrl must be at most " + MAX_SITE_URL + " characters");
        }
        if (username.length() > MAX_USERNAME) {
            throw bad("accountUsername must be at most " + MAX_USERNAME + " characters");
        }
        if (req.iv().length() > MAX_IV) {
            throw bad("iv must be at most " + MAX_IV + " characters");
        }
        if (req.encryptedPassword().length() > MAX_ENCRYPTED_PASSWORD) {
            throw bad("encryptedPassword is too long");
        }

        entry.setSiteName(siteName);
        entry.setSiteUrl(siteUrl);
        entry.setAccountUsername(username);
        entry.setEncryptedPassword(req.encryptedPassword());
        entry.setIv(req.iv());
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private String trim(String s) {
        return s == null ? null : s.trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
