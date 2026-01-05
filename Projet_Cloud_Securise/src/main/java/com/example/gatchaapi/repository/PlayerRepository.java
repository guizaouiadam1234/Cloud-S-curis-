package com.example.gatchaapi.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.gatchaapi.model.Player;
import java.util.Optional;

public interface PlayerRepository extends MongoRepository<Player, String> {
    Optional<Player> findByUsername(String username);
    Optional<Player> findByUserId(String userId); // Add this line
}