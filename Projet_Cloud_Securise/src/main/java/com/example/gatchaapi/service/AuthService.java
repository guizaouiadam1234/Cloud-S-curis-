package com.example.gatchaapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.User;
import com.example.gatchaapi.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    public String authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();
            if (user.getTokenExpiration() != null && user.getTokenExpiration().isAfter(LocalDateTime.now())) {
                // Token is still valid, return the existing token
                return user.getToken();
            } else {
                // Token has expired or does not exist, generate a new token
                String token = generateToken();
                user.setToken(token);
                user.setTokenExpiration(LocalDateTime.now().plusHours(1));
                userRepository.save(user);
                return token;
            }
        }
        throw new RuntimeException("Invalid credentials");
    }

    public boolean validateToken(String token) {
        Optional<User> userOpt = userRepository.findByToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getTokenExpiration().isAfter(LocalDateTime.now())) {
                user.setTokenExpiration(LocalDateTime.now().plusHours(1));
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }

    public User registerUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        return userRepository.save(user);
    }

    private String generateToken() {
        return UUID.randomUUID().toString();
    }
}