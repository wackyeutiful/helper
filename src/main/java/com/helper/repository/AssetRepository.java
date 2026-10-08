package com.helper.repository;

import com.helper.model.Asset;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface AssetRepository extends MongoRepository<Asset, String> {
    @Query("{ 'status': 'AVAILABLE', 'location': { $near: { $geometry: { type: 'Point', coordinates: [?0, ?1] }, $maxDistance: 50000 } } }")
    List<Asset> findNearestAvailable(double longitude, double latitude);
}