package org.example.invocationapi.repository;

import org.example.invocationapi.model.MonstreInvocable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InvocableMonsterRepository extends MongoRepository<MonstreInvocable, String> {
}
