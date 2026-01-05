package com.example.gatchaapi.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.gatchaapi.model.Combat;

public interface CombatRepository extends MongoRepository<Combat, String> {
}