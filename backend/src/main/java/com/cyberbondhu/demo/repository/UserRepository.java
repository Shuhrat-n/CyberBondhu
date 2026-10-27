package com.cyberbondhu.demo.repository;

import com.cyberbondhu.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // This custom method allows us to find a user by their username
    Optional<User> findByUsername(String username);
}