package org.example.invocationapi.repository;

import org.example.invocationapi.model.Invocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InvocationRepository extends MongoRepository<Invocation, String> {
    List<Invocation> findByProcessedFalse();
}
