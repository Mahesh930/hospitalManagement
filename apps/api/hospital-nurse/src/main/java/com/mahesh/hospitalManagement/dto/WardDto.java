package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WardDto {
    private UUID id;
    private UUID hospitalId;
    private String name;
    private String wardType;
    private Integer totalBeds;
    private String floorNumber;
    private String description;
    private int occupiedBeds;
    private int availableBeds;
}
