package com.example.gatchaapi.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.gatchaapi.model.Monster;

public interface MonsterRepository extends MongoRepository<Monster, String> {
}