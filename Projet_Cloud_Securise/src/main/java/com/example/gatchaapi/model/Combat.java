package com.example.gatchaapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "combats")
public class Combat {
    @Id
    private String id;
    private String monster1Id;
    private String monster2Id;
    private String winnerId;
    private List<String> combatLog;

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMonster1Id() {
        return monster1Id;
    }

    public void setMonster1Id(String monster1Id) {
        this.monster1Id = monster1Id;
    }

    public String getMonster2Id() {
        return monster2Id;
    }

    public void setMonster2Id(String monster2Id) {
        this.monster2Id = monster2Id;
    }

    public String getWinnerId() {
        return winnerId;
    }

    public void setWinnerId(String winnerId) {
        this.winnerId = winnerId;
    }

    public List<String> getCombatLog() {
        return combatLog;
    }

    public void setCombatLog(List<String> combatLog) {
        this.combatLog = combatLog;
    }
}