package com.example.gatchaapi.model;

public class Skill {
    public String name;
    public int damage;
    public double damageRatio;
    public int cooldown;
    public int level;
    static int  levelMax;

    public Skill(String name, int damage, double damageRatio, int cooldown, int level) {
        this.name = name;
        this.damage = damage;
        this.damageRatio = damageRatio;
        this.cooldown = cooldown;
        this.level = level;
    }

    @Override

    public String toString() {
        return"Skill {"+
                "name="+name+
                "damage="+damage+
                "damageRatio="+damageRatio+
                "coolDown="+cooldown+
                "level="+level+
                "levelMax="+levelMax;

    }
}


