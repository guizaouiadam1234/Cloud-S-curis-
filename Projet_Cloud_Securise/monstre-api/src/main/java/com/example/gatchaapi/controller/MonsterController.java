package com.example.gatchaapi.controller;

import com.example.gatchaapi.MonsterDto.Element;
import com.example.gatchaapi.MonsterDto.MonsterDto;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.service.MonsterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monsters")
public class MonsterController {

    private final MonsterService service;
    public MonsterController(MonsterService service) {this.service = service;}


    @PostMapping("/save")
    public ResponseEntity<String> monsters (@RequestBody MonsterDto monster, @RequestHeader("Authorization") String token) {

        String monsterId = service.saveMonster(new Monster(
                monster.getName(),
                monster.getAttack(),
                monster.getDefense(),
                monster.getHp(),
                monster.getLevel(),
                monster.getElement().toString(),
                monster.getSpeed(),
                monster.getXp(),
                monster.getSkills()),
                token
        );
        return ResponseEntity.ok(monsterId);
    }

    @GetMapping("/{name}")
    public ResponseEntity<List<MonsterDto>> getmonsters (@PathVariable String name, @RequestHeader("Authorization") String token) {
        List<MonsterDto> monstersByName = service.findByName(name, token)
                .stream()
                .map(monster -> new MonsterDto(monster.getName(),
                        monster.getId(),
                        monster.getAttack(),
                        monster.getDefense(),
                        monster.getHp(),
                        monster.getLevel(),
                        Element.valueOf(monster.getElement().toString()),
                        monster.getSpeed(),
                        monster.getXp(),
                        monster.getSkills())  )
                .toList();
        return ResponseEntity.ok(monstersByName)  ;
    }

    @GetMapping("/all")
    public ResponseEntity<List<MonsterDto>> getAllMonsters(@RequestHeader("Authorization") String token) {
        List<MonsterDto> allMonsters = service.findAll(token)
                .stream()
                .map(monster -> new MonsterDto(monster.getName(),
                        monster.getId(),
                        monster.getAttack(),
                        monster.getDefense(),
                        monster.getHp(),
                        monster.getLevel(),
                        Element.valueOf(monster.getElement().toString()),
                        monster.getSpeed(),
                        monster.getXp(),
                        monster.getSkills())  )
                .toList();
        return ResponseEntity.ok(allMonsters);
    }

    @GetMapping("/elements/{element}")
    public ResponseEntity<List<MonsterDto>> getMonstersElement(@PathVariable String element, @RequestHeader("Authorization") String token) {
        List<MonsterDto> elementMonsters = service.findElement(element, token)
                .stream()
                .map(monster -> new MonsterDto(monster.getName(),
                        monster.getId(),
                        monster.getAttack(),
                        monster.getDefense(),
                        monster.getHp(),
                        monster.getLevel(),
                        Element.valueOf(monster.getElement()),
                        monster.getSpeed(),
                        monster.getXp(),
                        monster.getSkills())  )
                .toList();
        return ResponseEntity.ok(elementMonsters);
    }

    @PutMapping("/levelup/id={id}/skill={skillIndex}")
    public ResponseEntity<Monster> levelUpMonster (@PathVariable String id,@PathVariable int skillIndex, @RequestHeader("Authorization") String token) {
        //Monster toLevelUp = service.findById("Dracaufeu").getFirst();
        //int oldLevel = toLevelUp.getLevel();
        Monster updatedMonster = service.updateMonster(id,skillIndex, token);
        //int newLevel = toLevelUp.getLevel();
        return ResponseEntity.ok(updatedMonster);
    }

    @PutMapping("/giveXp/id={id}/skill={skillIndex}")
    public ResponseEntity<Monster> giveXp (@PathVariable String id,@PathVariable int skillIndex, @RequestHeader("Authorization") String token) {
        Monster updatedMonster = service.giveXp(id,skillIndex, token);
        return ResponseEntity.ok(updatedMonster);
    }

    @DeleteMapping("/delete/id={id}")
    public ResponseEntity<Void> deleteMonster(@PathVariable String id, @RequestHeader("Authorization") String token) {
        service.deleteMonster(id, token);
        return ResponseEntity.noContent().build();
    }
}