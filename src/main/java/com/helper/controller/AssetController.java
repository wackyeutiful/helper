package com.helper.controller;

import com.helper.model.Asset;
import com.helper.repository.AssetRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetRepository assetRepository;

    public AssetController(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @GetMapping
    public List<Asset> getAll() {
        return assetRepository.findAll();
    }

    @PostMapping
    public Asset create(@RequestBody Asset asset) {
        return assetRepository.save(asset);
    }

    @GetMapping("/nearest")
    public List<Asset> getNearest(@RequestParam double lng, @RequestParam double lat) {
        return assetRepository.findNearestAvailable(lng, lat);
    }
}