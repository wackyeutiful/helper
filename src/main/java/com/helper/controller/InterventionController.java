package com.helper.controller;

import com.helper.model.Asset;
import com.helper.model.Intervention;
import com.helper.repository.AssetRepository;
import com.helper.repository.InterventionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interventions")
@CrossOrigin(origins = "*")
public class InterventionController {

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private AssetRepository assetRepository;

    // ===== APPEL AU MICROSERVICE IA (backend tourne DANS Docker → ai-service) =====
    private Map<String, Object> callAIService(String endpoint, Map<String, Object> payload) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        RestTemplate restTemplate = new RestTemplate(factory);

        String url = "http://ai-service:5001" + endpoint;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            System.out.println("⚠️ Erreur IA : " + e.getMessage());
            return null;
        }
    }

    @GetMapping
    public List<Intervention> getAll() {
        return interventionRepository.findAll();
    }

    @GetMapping("/test")
    public String test() {
        return "OK";
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Intervention intervention) {
        System.out.println("📩 Requête reçue : " + intervention);
        try {
            // 1. Position
            double lng = intervention.getLocation()[0];
            double lat = intervention.getLocation()[1];
            System.out.println("📍 Position : " + lng + ", " + lat);

            // 2. Classification IA
            try {
                Map<String, Object> classifyPayload = new HashMap<>();
                classifyPayload.put("text", intervention.getDescription() != null ? intervention.getDescription() : "");
                Map<String, Object> classification = callAIService("/classify", classifyPayload);
                if (classification != null && classification.containsKey("types")) {
                    List<String> types = (List<String>) classification.get("types");
                    if (!types.isEmpty()) {
                        intervention.setClassificationType(types.get(0));
                    }
                    System.out.println("🤖 Classification IA : " + types);
                }
            } catch (Exception e) {
                System.out.println("⚠️ Classification IA ignorée : " + e.getMessage());
            }

            // 3. Trouver le moyen disponible le plus proche (50km)
            List<Asset> nearestAssets = assetRepository.findNearestAvailable(lng, lat);
            System.out.println("🚢 Moyens trouvés : " + nearestAssets.size());

            Asset assignedAsset = null;
            if (!nearestAssets.isEmpty()) {
                assignedAsset = nearestAssets.get(0);
                intervention.setAssignedAssetId(assignedAsset.getId());
                assignedAsset.setStatus("ON_MISSION");
                assetRepository.save(assignedAsset);
                System.out.println("✅ Assigné à : " + assignedAsset.getName());
            } else {
                System.out.println("⚠️ Aucun moyen disponible.");
            }

            // 4. Prédiction ETA IA
            if (assignedAsset != null) {
                try {
                    Map<String, Object> etaPayload = new HashMap<>();
                    etaPayload.put("lat", assignedAsset.getLocation()[1]);
                    etaPayload.put("lng", assignedAsset.getLocation()[0]);
                    etaPayload.put("dest_lat", lat);
                    etaPayload.put("dest_lng", lng);
                    Map<String, Object> etaResult = callAIService("/predict-eta", etaPayload);
                    if (etaResult != null && etaResult.containsKey("eta_formatted")) {
                        intervention.setEtaFormatted((String) etaResult.get("eta_formatted"));
                        System.out.println("🕒 ETA estimé : " + etaResult.get("eta_formatted"));
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ ETA IA ignorée : " + e.getMessage());
                }
            }

            // 5. Statut et date
            intervention.setStatus("PENDING");
            intervention.setCreatedAt(LocalDateTime.now());

            // 6. Sauvegarde
            Intervention saved = interventionRepository.save(intervention);
            System.out.println("💾 Sauvegardé avec ID : " + saved.getId());
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    // ===== ENDPOINT CHATBOT =====
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.get("message"));
        Map<String, Object> result = callAIService("/chat", payload);

        String response = "Service IA indisponible.";
        if (result != null && result.containsKey("response")) {
            response = (String) result.get("response");
        }
        return Map.of("response", response);
    }
}