package com.example.gatchaapi.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import com.example.gatchaapi.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByToken(String token);
}