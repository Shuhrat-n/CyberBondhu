package com.cyberbondhu.demo.controller;

import com.cyberbondhu.demo.model.User;
import com.cyberbondhu.demo.repository.UserRepository;
import com.cyberbondhu.demo.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor; 

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, String> request) {
        String fullName = request.get("fullName");
        String email = request.get("email");
        String password = request.get("password");

        if (fullName == null || email == null || password == null) {
            return ResponseEntity.badRequest().body("Error: All fields are required!");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: Email already exists!");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password)); 
        user.setKdfSalt("dummy_salt_for_now"); // Will be updated by frontend JS later
        user.setPreferredLanguage("en"); // Default
        
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Error: Invalid email or password");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Invalid email or password");
        }

        User user = userOptional.get();
        
        if (passwordEncoder.matches(password, user.getPassword())) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String jwtToken = jwtService.generateToken(userDetails);
            
            return ResponseEntity.ok(Map.of("token", jwtToken, "message", "Login successful!"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Invalid email or password");
        }
    }
}