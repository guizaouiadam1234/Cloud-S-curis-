package com.example.gatchaapi.model;

public class Skill {
    private String name;
    private int baseDamage;
    private double damageRatio;
    private int cooldown;
    private int upgradeLevel;
    private int maxUpgradeLevel;

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getBaseDamage() {
        return baseDamage;
    }

    public void setBaseDamage(int baseDamage) {
        this.baseDamage = baseDamage;
    }

    public double getDamageRatio() {
        return damageRatio;
    }

    public void setDamageRatio(double damageRatio) {
        this.damageRatio = damageRatio;
    }

    public int getCooldown() {
        return cooldown;
    }

    public void setCooldown(int cooldown) {
        this.cooldown = cooldown;
    }

    public int getUpgradeLevel() {
        return upgradeLevel;
    }

    public void setUpgradeLevel(int upgradeLevel) {
        this.upgradeLevel = upgradeLevel;
    }

    public int getMaxUpgradeLevel() {
        return maxUpgradeLevel;
    }

    public void setMaxUpgradeLevel(int maxUpgradeLevel) {
        this.maxUpgradeLevel = maxUpgradeLevel;
    }
}