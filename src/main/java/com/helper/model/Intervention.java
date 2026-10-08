package com.helper.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interventions")
public class Intervention {
    @Id
    private String id;
    private String vesselName;
    private String description;
    private String severity;
    private double[] location;
    private String assignedAssetId;
    private String status;
    private LocalDateTime createdAt;
    private String classificationType;
    private String etaFormatted;
}