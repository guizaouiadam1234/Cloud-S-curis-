package org.example.playerapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "joueurs")
public class Joueur {
    @Id
    private String userId;
    private int level;
    private int experience;
    private List<String> monstres;

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getExperience() {
        return experience;
    }

    public void setExperience(int experience) {
        this.experience = experience;
    }

    public List<String> getMonstres() {
        return monstres;
    }

    public void setMonstres(List<String> monstres) {
        this.monstres = monstres;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    // Getters and Setters
}