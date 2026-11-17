package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleCatalogItemDto {
    private String role;
    private String displayName;
    private String category;
    private String stationPath;
    private String description;
    private List<String> permissions;
    private boolean seeded;
    private String demoUsername;
}
