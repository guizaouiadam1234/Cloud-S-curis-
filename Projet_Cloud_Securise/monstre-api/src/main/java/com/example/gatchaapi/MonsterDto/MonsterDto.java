package com.example.gatchaapi.MonsterDto;

import com.example.gatchaapi.model.Skill;

import java.util.List;


public class MonsterDto {

    private String name;
    private String id;
    private int attack;
    private int defense;
    private int hp;
    private int xp;
    private int level;
    private List<Skill> skills;
    private int speed;
    private Element element;

    public String getName(){
        return name;
    }
    public int getLevel(){
        return level;
    }
    public int getAttack(){
        return attack;
    }
    public int getDefense(){
        return defense;
    }
    public int getHp(){
        return hp;
    }

    public List<Skill> getSkills() {
        return skills;
    }

    public int getXp(){return xp;}
    public int getSpeed(){ return speed;}
    public Element getElement(){
        return element;
    }

    public String getId(){
        return id;
    }

    public MonsterDto(String name,String id,int attack,int defense,int hp,int level,Element element,int speed,int xp,List<Skill> skills ){
        this.name = name;
        this.attack= attack;
        this.defense = defense;
        this.hp = hp;
        this.level = level;
        this.element = element;
        this.id = id;
        this.speed = speed;
        this.xp=xp;
        this.skills = skills;
    }
}
