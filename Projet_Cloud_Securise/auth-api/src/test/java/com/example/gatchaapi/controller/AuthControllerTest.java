package com.example.gatchaapi.controller;

import com.example.gatchaapi.model.User;
import com.example.gatchaapi.service.AuthService;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    public AuthControllerTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testLoginSuccess() {
        User user = new User();
        user.setUsername("user");
        user.setPassword("password");
        String token = "mockToken";
        when(authService.authenticate(user.getUsername(),user.getPassword())).thenReturn(token);

        ResponseEntity<String> response = authController.login(user.getUsername(),user.getPassword());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(token, response.getBody());
    }

    @Test
    public void testValidateTokenSuccess() {
        String token = "validToken";
        when(authService.validateToken(anyString())).thenReturn(String.valueOf(true));

        ResponseEntity<String> response = authController.validate(token);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

}