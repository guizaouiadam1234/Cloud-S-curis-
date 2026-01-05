package com.example.gatchaapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.Summoning;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.repository.SummoningRepository;
import com.example.gatchaapi.repository.MonsterRepository;

import java.util.List;
import java.util.Random;

@Service
public class SummoningService {
    @Autowired
    private SummoningRepository summoningRepository;

    @Autowired
    private MonsterRepository monsterRepository;

    public Summoning summonMonster(String playerId) {
        List<Monster> monsters = monsterRepository.findAll();
        Monster summonedMonster = getRandomMonster(monsters);
        Summoning summoning = new Summoning();
        summoning.setMonsterId(summonedMonster.getId());
        summoning.setPlayerId(playerId);
        summoning.setProbability(calculateProbability(summonedMonster));
        return summoningRepository.save(summoning);
    }

    private Monster getRandomMonster(List<Monster> monsters) {
        Random random = new Random();
        return monsters.get(random.nextInt(monsters.size()));
    }

    private double calculateProbability(Monster monster) {
        // Implement your probability calculation logic here
        return 0.1; // Example probability
    }
}