package org.example.invocationapi.model;

public class Skill {
    public String name;
    public int damage;
    public double damageRatio;
    public int coolDown;
    public int level;
    public int levelMax;


    @Override

    public String toString() {
        return"Skill {"+
                "name="+name+
                "damage="+damage+
                "damageRatio="+damageRatio+
                "coolDown="+coolDown+
                "level="+level+
                "levelMax="+levelMax;

    }
}


