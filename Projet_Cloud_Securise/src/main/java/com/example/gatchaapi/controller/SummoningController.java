package com.example.gatchaapi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.gatchaapi.model.Summoning;
import com.example.gatchaapi.service.SummoningService;

@RestController
@RequestMapping("/api/summonings")
public class SummoningController {
    @Autowired
    private SummoningService summoningService;

    @PostMapping
    public ResponseEntity<Summoning> summonMonster(@RequestHeader("Authorization") String token, @RequestParam String playerId) {
        Summoning summoning = summoningService.summonMonster(playerId);
        return ResponseEntity.ok(summoning);
    }
}