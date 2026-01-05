package com.example.gatchaapi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.service.MonsterService;

import java.util.List;

@RestController
@RequestMapping("/api/monsters")
public class MonsterController {
    @Autowired
    private MonsterService monsterService;

    @GetMapping
    public ResponseEntity<List<Monster>> getAllMonsters() {
        List<Monster> monsters = monsterService.getAllMonsters();
        return ResponseEntity.ok(monsters);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Monster> getMonsterById(@PathVariable String id) {
        Monster monster = monsterService.getMonsterById(id);
        return ResponseEntity.ok(monster);
    }

    @PostMapping
    public ResponseEntity<Monster> createMonster(@RequestBody Monster monster) {
        Monster createdMonster = monsterService.createMonster(monster);
        return ResponseEntity.ok(createdMonster);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Monster> updateMonster(@PathVariable String id, @RequestBody Monster monsterDetails) {
        Monster updatedMonster = monsterService.updateMonster(id, monsterDetails);
        return ResponseEntity.ok(updatedMonster);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonster(@PathVariable String id) {
        monsterService.deleteMonster(id);
        return ResponseEntity.noContent().build();
    }
}