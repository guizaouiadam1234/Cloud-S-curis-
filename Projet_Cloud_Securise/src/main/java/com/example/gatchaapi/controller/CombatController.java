package com.example.gatchaapi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.gatchaapi.model.Combat;
import com.example.gatchaapi.service.CombatService;

@RestController
@RequestMapping("/api/combats")
public class CombatController {
    @Autowired
    private CombatService combatService;

    @PostMapping
    public ResponseEntity<Combat> simulateCombat(@RequestParam String monster1Id, @RequestParam String monster2Id) {
        Combat combat = combatService.simulateCombat(monster1Id, monster2Id);
        return ResponseEntity.ok(combat);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Combat> getCombatById(@PathVariable String id) {
        Combat combat = combatService.getCombatById(id);
        return ResponseEntity.ok(combat);
    }
}