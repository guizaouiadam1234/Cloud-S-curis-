package org.example.playerapi.controller;

import org.example.playerapi.model.Joueur;
import org.example.playerapi.service.JoueurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/joueur")
public class JoueurController {
    @Autowired
    private JoueurService joueurService;

    @GetMapping("/profile")
    public ResponseEntity<Joueur> getJoueur(@RequestHeader("Authorization") String token) {
        return ResponseEntity.of(joueurService.getJoueurByToken(token));
    }

    @PostMapping("/gainExperience")
    public ResponseEntity<Joueur> gainExperience(@RequestParam int experience, @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(joueurService.gainExperience(token, experience));
    }

    @PostMapping("/addMonstre")
    public ResponseEntity<Joueur> addMonstre(@RequestParam String monstreId, @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(joueurService.addMonstre(monstreId, token));
    }

    @PostMapping("/removeMonstre")
    public ResponseEntity<Joueur> removeMonstre(@PathVariable String id, @RequestParam String monstreId, @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(joueurService.removeMonstre(monstreId, token));
    }
}