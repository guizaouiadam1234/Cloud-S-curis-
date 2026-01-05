package com.example.gatchaapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gatchaapi.model.Player;
import com.example.gatchaapi.repository.PlayerRepository;
import com.example.gatchaapi.repository.UserRepository;
import com.example.gatchaapi.model.User;

import java.util.List;
import java.util.Optional;

@Service
public class PlayerService {
    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserRepository userRepository;

    public Player getPlayerProfile(String token) {
        User user = getUserByToken(token);
        return playerRepository.findByUserId(user.getId()).orElseThrow(() -> new RuntimeException("Player not found"));
    }

    public int getPlayerLevel(String token) {
        Player player = getPlayerProfile(token);
        return player.getLevel();
    }

    public List<String> getPlayerMonsters(String token) {
        Player player = getPlayerProfile(token);
        return player.getMonsters();
    }

    public Player gainExperience(String token, int experience) {
        Player player = getPlayerProfile(token);
        player.setExperience(player.getExperience() + experience);
        return playerRepository.save(player);
    }

    public Player levelUp(String token) {
        Player player = getPlayerProfile(token);
        player.setLevel(player.getLevel() + 1);
        player.setExperience(0);
        return playerRepository.save(player);
    }

    public Player addMonster(String token, String monsterId) {
        Player player = getPlayerProfile(token);
        player.getMonsters().add(monsterId);
        return playerRepository.save(player);
    }

    public Player removeMonster(String token, String monsterId) {
        Player player = getPlayerProfile(token);
        player.getMonsters().remove(monsterId);
        return playerRepository.save(player);
    }

    private User getUserByToken(String token) {
        return userRepository.findByToken(token).orElseThrow(() -> new RuntimeException("Invalid token"));
    }
}