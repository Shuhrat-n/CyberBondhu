package com.cyberbondhu.demo.vault;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Turns errors from the vault API into a small JSON body, e.g. {"error": "Vault entry not found"}.
 * Applies only to VaultEntryController, so other controllers are not affected.
 */
@RestControllerAdvice(assignableTypes = VaultEntryController.class)
public class VaultExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", message));
    }

    // e.g. a userId that does not exist in the users table (foreign-key violation)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "The data could not be saved (for example, the userId does not exist)"));
    }
}
