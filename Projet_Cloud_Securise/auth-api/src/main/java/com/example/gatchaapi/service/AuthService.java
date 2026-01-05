package com.example.gatchaapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.User;
import com.example.gatchaapi.repository.UserRepository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
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

    public String validateToken(String token) {
        Optional<User> userOpt = userRepository.findByToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getTokenExpiration().isAfter(LocalDateTime.now())) {
                user.setTokenExpiration(LocalDateTime.now().plusHours(1));
                userRepository.save(user);
                return user.getUsername();
            }
        }
        throw new RuntimeException("Invalid or expired token");
    }

    public User registerUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            return null;
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        return userRepository.save(user);
    }

    @PostConstruct
    public void importUsers() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        List<User> users = objectMapper.readValue(new File("src/main/resources/users.json"), new TypeReference<List<User>>(){});
        for (User user : users) {
            String username = user.getUsername();
            String password = user.getPassword();
            this.registerUser(username, password);
        }
    }
    private String generateToken() {
        return UUID.randomUUID().toString();
    }
}