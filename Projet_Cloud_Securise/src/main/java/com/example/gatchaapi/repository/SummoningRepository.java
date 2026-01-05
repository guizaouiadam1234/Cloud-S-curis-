package com.example.gatchaapi.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.gatchaapi.model.Summoning;

public interface SummoningRepository extends MongoRepository<Summoning, String> {
}