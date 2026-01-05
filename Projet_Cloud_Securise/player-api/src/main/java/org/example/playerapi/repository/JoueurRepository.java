package org.example.playerapi.repository;

import org.example.playerapi.model.Joueur;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface JoueurRepository extends MongoRepository<Joueur, String> {
    Optional<Joueur>findByUserId(String userId);
}
