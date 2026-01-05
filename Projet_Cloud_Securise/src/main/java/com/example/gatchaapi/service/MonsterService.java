package com.example.gatchaapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.repository.MonsterRepository;

import java.util.List;

@Service
public class MonsterService {
    @Autowired
    private MonsterRepository monsterRepository;

    public List<Monster> getAllMonsters() {
        return monsterRepository.findAll();
    }

    public Monster getMonsterById(String id) {
        return monsterRepository.findById(id).orElseThrow(() -> new RuntimeException("Monster not found"));
    }

    public Monster createMonster(Monster monster) {
        return monsterRepository.save(monster);
    }

    public Monster updateMonster(String id, Monster monsterDetails) {
        Monster monster = getMonsterById(id);
        monster.setType(monsterDetails.getType());
        monster.setHp(monsterDetails.getHp());
        monster.setAtk(monsterDetails.getAtk());
        monster.setDef(monsterDetails.getDef());
        monster.setVit(monsterDetails.getVit());
        monster.setSkills(monsterDetails.getSkills());
        return monsterRepository.save(monster);
    }

    public void deleteMonster(String id) {
        Monster monster = getMonsterById(id);
        monsterRepository.delete(monster);
    }
}