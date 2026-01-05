package org.example.invocationapi.controller;

import org.example.invocationapi.model.Invocation;
import org.example.invocationapi.model.MonstreInvocable;
import org.example.invocationapi.service.InvocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invocation")
public class InvocationController {
    @Autowired
    private InvocationService invocationService;

    @PostMapping("/invoke")
    public ResponseEntity<MonstreInvocable> invokeMonster(@RequestHeader("Authorization") String token) {
        MonstreInvocable monstre = invocationService.invokeMonster(token);
        return ResponseEntity.ok(monstre);
    }

}