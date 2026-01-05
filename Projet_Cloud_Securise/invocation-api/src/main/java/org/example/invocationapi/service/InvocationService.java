package org.example.invocationapi.service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.example.invocationapi.model.Invocation;
import org.example.invocationapi.model.MonstreInvocable;
import org.example.invocationapi.repository.InvocableMonsterRepository;
import org.example.invocationapi.repository.InvocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class InvocationService {
    @Autowired
    private InvocationRepository invocationRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private InvocableMonsterRepository invocableMonsterRepository;

    private Random random = new Random();

    private static String MONSTER_API_URL = "http://monstre-api:8083/api/monsters/save";
    private static String PLAYER_API_URL = "http://player-api:8082/api/joueur/addMonstre";

    public MonstreInvocable invokeMonster(String token) {
        String userId = getUserIdByToken(token);


        List<MonstreInvocable> monsters = invocableMonsterRepository.findAll();
        MonstreInvocable selectedMonster = selectMonsterByProbability(monsters);
        System.out.println("monster id: " + selectedMonster);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        HttpEntity<MonstreInvocable> entityMonster = new HttpEntity<>(selectedMonster, headers);
        String monstreId = restTemplate.postForObject(MONSTER_API_URL, entityMonster, String.class);

        if (monstreId == null || monstreId.isEmpty()) {
            throw new RuntimeException("Aucun monstre disponible !");
        }


        Invocation invocation = new Invocation();
        invocation.setMonstreId(monstreId);
        invocation.setTimestamp(LocalDateTime.now());
        invocation.setProcessed(false);
        invocationRepository.save(invocation);

        try {
            HttpEntity<String> entityPlayer = new HttpEntity<>(monstreId, headers);
            restTemplate.postForObject(PLAYER_API_URL+"?monstreId="+monstreId, entityPlayer, String.class);
            invocation.setProcessed(true);
            invocationRepository.save(invocation);
        } catch (Exception e) {
            System.err.println("Erreur d'ajout du monstre au joueur : " + e.getMessage());
        }

        return selectedMonster;
    }

    private MonstreInvocable selectMonsterByProbability(List<MonstreInvocable> monsters) {
        double totalProbability = monsters.stream().mapToDouble(MonstreInvocable::getProbability).sum();
        double randomValue = random.nextDouble() * totalProbability;
        double cumulativeProbability = 0.0;
        for (MonstreInvocable monster : monsters) {
            cumulativeProbability += monster.getProbability();
            if (randomValue <= cumulativeProbability) {
                return monster;
            }
        }
        return monsters.get(monsters.size() - 1); // Fallback
    }

    public String getUserIdByToken(String token) {
        String authUrl = "http://auth-api:8081/api/auth/validate?token=" + token;

        ResponseEntity<String> response = restTemplate.getForEntity(authUrl, String.class);
        System.out.println("Response: " + response);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return response.getBody(); // Return the user ID
        } else {
            throw new RuntimeException("Invalid or expired token");
        }
    }

    @PostConstruct
    public void initMonsters(){
        ObjectMapper mapper = new ObjectMapper();
        try {
            List<MonstreInvocable> monsters = mapper.readValue(new File("src/main/resources/monstres.json"), new TypeReference<List<MonstreInvocable>>(){});
            invocableMonsterRepository.saveAll(monsters);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}