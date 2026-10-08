package com.helper.repository;

import com.helper.model.Intervention;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InterventionRepository extends MongoRepository<Intervention, String> {
}