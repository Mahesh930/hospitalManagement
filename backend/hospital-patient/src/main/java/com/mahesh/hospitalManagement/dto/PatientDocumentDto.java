package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDocumentDto {
    private UUID id;
    private UUID patientId;
    private String docType;
    private String fileName;
    private String fileUri;
    private String mimeType;
    private Long sizeBytes;
    private String uploadedBy;
    private LocalDateTime createdAt;
}
