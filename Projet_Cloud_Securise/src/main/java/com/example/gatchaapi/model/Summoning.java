package com.example.gatchaapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "summonings")
public class Summoning {
    @Id
    private String id;
    private String monsterId;
    private String playerId;
    private double probability;

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMonsterId() {
        return monsterId;
    }

    public void setMonsterId(String monsterId) {
        this.monsterId = monsterId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

    public double getProbability() {
        return probability;
    }

    public void setProbability(double probability) {
        this.probability = probability;
    }
}