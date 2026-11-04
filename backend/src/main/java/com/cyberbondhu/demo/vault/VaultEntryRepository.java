package com.cyberbondhu.demo.vault;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VaultEntryRepository extends JpaRepository<VaultEntry, Integer> {

    List<VaultEntry> findByUserId(Integer userId);

    // Lets the controller fetch an entry only if it belongs to the given user.
    Optional<VaultEntry> findByEntryIdAndUserId(Integer entryId, Integer userId);
}
