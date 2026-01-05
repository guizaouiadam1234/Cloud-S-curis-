package com.example.gatchaapi.controller;

import com.example.gatchaapi.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.gatchaapi.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestParam String username, @RequestParam String password) {
        String token = authService.authenticate(username, password);
        System.out.println("Received Username: " + username);
        System.out.println("Received Password: " + password);
        return ResponseEntity.ok(token);
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validate(@RequestParam String token) {
        String userId = authService.validateToken(token);
        return ResponseEntity.ok(userId);

    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestParam String username, @RequestParam String password) {
        User user = authService.registerUser(username, password);
        return ResponseEntity.ok(user);
    }
}