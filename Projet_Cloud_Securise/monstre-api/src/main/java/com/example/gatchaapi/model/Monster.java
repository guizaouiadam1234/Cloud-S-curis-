package com.example.gatchaapi.model;

import java.util.List;
//import org.springframework.data.annotation.Id;

//Model

public class Monster {
    private String element;
    private String name;
    private int attack;
    private int defense;
    private int hp;
    private int speed;
    private int xp;
    private int level;
    private String id;
    private List<Skill> skills;
    private String userId;  // username du player qui a ce monstre
    private static int idCounter = 10;

    public String getName(){
        return name;
    }
    public int getLevel(){
        return level;
    }
    public int getAttack(){
        return attack;
    }
    // Alias for compatibility with code that expects getAtk()
    public int getAtk() { return attack; }
    public int getDefense(){
        return defense;
    }
    public int getHp(){
        return hp;
    }
    public int getSpeed(){return speed;}
    public int getXp(){return xp;}
    public List<Skill> getSkills(){return skills;}
    public String getElement() {
        return element;
    }

    public void setLevel(int level) {
        this.level = level;
    }
    public void setAttack(int attack){this.attack=attack;}
    public void setDefense(int defense){this.defense=defense;}
    public void setHp(int hp){this.hp=hp;}
    public void setSpeed(int speed){this.speed=speed;}
    public void setXp(int xp) {this.xp = xp;}
    public String getId() {
        return id;
    }


    public Monster(String name,int attack, int defense, int hp,int level,String element,int speed,int xp,List<Skill> skills) {
        this.name = name;
        this.attack= attack;
        this.defense = defense;
        this.hp = hp;
        this.level = level;
        this.element = element;
        this.id= String.valueOf(generateId());
        this.speed=speed;
        this.xp=xp;
        this.skills=skills;
    }

    public void levelUp(){
        this.level++;
        this.attack+=10;
    }

    @Override
    public String toString() {
        return "Monster {"+
                "Id ="+id+
                "name="+ name+
                "element="+ element+
                "level = "+level+
                "attack ="+attack+
                "defense = "+defense+
                "hp = "+hp+
                "}";
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    private synchronized String generateId() {
        return this.name + idCounter++;
    }
}