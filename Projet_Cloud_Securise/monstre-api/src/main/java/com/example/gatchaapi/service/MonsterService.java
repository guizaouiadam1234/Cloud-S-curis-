package com.example.gatchaapi.service;
import com.example.gatchaapi.model.Monster;
import com.example.gatchaapi.repository.MonsterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class MonsterService {

    @Autowired
    private MonsterRepository repo;

    @Autowired
    private RestTemplate restTemplate;


    public MonsterService(MonsterRepository repo) {
        this.repo = repo;
    }

    public String saveMonster(Monster monster, String token) {
        String userId = getUserIdByToken(token);
        monster.setUserId(userId);
        repo.save(monster);
        return monster.getId();
    }

    public List<Monster> findByName(String name, String token) {
        String userId = getUserIdByToken(token);
        List<Monster> monsters = repo.findByName(name);
        return monsters.stream()
                .filter(monster -> monster.getUserId().equals(userId))
                .toList();
    }

    public List<Monster> findAll(String token) {
        String userId = getUserIdByToken(token);
        List<Monster> monsters = repo.findAll();
        return monsters.stream()
                .filter(monster -> monster.getUserId().equals(userId))
                .toList();

    }

    public List<Monster> findElement(String element, String token) {
        String userId = getUserIdByToken(token);
        List<Monster> monsters = repo.findByElement(element);
        return monsters.stream()
                .filter(monster -> monster.getUserId().equals(userId))
                .toList();
    }


    public Monster getMonsterById(String id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Monster not found"));
    }

    public Monster updateMonster(String id,int skillIndex, String token) {
        Monster monster = getMonsterById(id);
        String userId = getUserIdByToken(token);
        if (!monster.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized action: User ID does not match");
        }
        leveledUp(monster, skillIndex);
        return repo.save(monster);
    }

    public void leveledUp(Monster monster,int skillIndex) {
            monster.setLevel(monster.getLevel()+1);
            monster.setXp(0);
            monster.setAttack(monster.getAttack()+10);
            monster.setDefense(monster.getDefense()+10);
            monster.setHp(monster.getHp()+10);
            monster.setSpeed(monster.getSpeed()+10);
            monster.getSkills().get(skillIndex).level+=1;

    }
    public Monster giveXp(String id,int skillIndex, String token) {
        Monster monster = getMonsterById(id);
        String userId = getUserIdByToken(token);
        if (!monster.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access: User ID does not match");
        }
        monster.setXp(monster.getXp() + 20);
        if (monster.getXp() > 200) {
            leveledUp(monster, skillIndex);
        }
        return repo.save(monster);
    }

    public void deleteMonster(String id, String token) {
        Monster monster = getMonsterById(id);
        String userId = getUserIdByToken(token);
        if (!monster.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access: User ID does not match");
        }
        repo.deleteById(id);
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

}
