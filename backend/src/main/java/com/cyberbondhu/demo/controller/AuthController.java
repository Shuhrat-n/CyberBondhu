package com.cyberbondhu.demo.controller;

import com.cyberbondhu.demo.model.User;
import com.cyberbondhu.demo.repository.UserRepository;

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

    // REGISTER ENDPOINT
    @PostMapping("/register")
    public String register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (userRepository.findByUsername(username).isPresent()) {
            return "Error: Username already exists!";
        }

        User user = new User();
        user.setUsername(username);
        // HASHING HAPPENS HERE: We encode the raw password before saving
        user.setPassword(passwordEncoder.encode(password)); 
        
        userRepository.save(user);
        return "User registered successfully!";
    }

    // LOGIN ENDPOINT
    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            return "Error: User not found!";
        }

        User user = userOptional.get();
        // COMPARING HASHES: We check if the raw password matches the hash in the DB
        if (passwordEncoder.matches(password, user.getPassword())) {
            return "Login successful! Welcome " + username;
        } else {
            return "Error: Incorrect password!";
        }
    }
}