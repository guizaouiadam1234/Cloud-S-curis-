package com.example.gatchaapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.Combat;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.repository.CombatRepository;
import com.example.gatchaapi.repository.MonsterRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class CombatService {
    @Autowired
    private CombatRepository combatRepository;

    @Autowired
    private MonsterRepository monsterRepository;

    public Combat simulateCombat(String monster1Id, String monster2Id) {
        Monster monster1 = monsterRepository.findById(monster1Id).orElseThrow(() -> new RuntimeException("Monster 1 not found"));
        Monster monster2 = monsterRepository.findById(monster2Id).orElseThrow(() -> new RuntimeException("Monster 2 not found"));

        List<String> combatLog = new ArrayList<>();
        String winnerId = simulateBattle(monster1, monster2, combatLog);

        Combat combat = new Combat();
        combat.setMonster1Id(monster1Id);
        combat.setMonster2Id(monster2Id);
        combat.setWinnerId(winnerId);
        combat.setCombatLog(combatLog);

        return combatRepository.save(combat);
    }

    private String simulateBattle(Monster monster1, Monster monster2, List<String> combatLog) {
        // Implement your combat simulation logic here
        // Example logic: Monster with higher attack wins
        if (monster1.getAtk() > monster2.getAtk()) {
            combatLog.add("Monster 1 wins");
            return monster1.getId();
        } else {
            combatLog.add("Monster 2 wins");
            return monster2.getId();
        }
    }

    public Combat getCombatById(String id) {
        return combatRepository.findById(id).orElseThrow(() -> new RuntimeException("Combat not found"));
    }
}