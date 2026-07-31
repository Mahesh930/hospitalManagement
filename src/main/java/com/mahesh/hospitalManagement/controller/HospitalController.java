package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.HospitalDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDto>> provisionHospital(@RequestBody HospitalDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        HospitalDto created = hospitalService.provisionHospital(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Hospital workspace provisioned successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDto>> getHospital(@PathVariable UUID id) {
        HospitalDto hospital = hospitalService.getHospital(id);
        return ResponseEntity.ok(ApiResponse.success(hospital));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HospitalDto>>> getAllHospitals() {
        List<HospitalDto> hospitals = hospitalService.getAllHospitals();
        return ResponseEntity.ok(ApiResponse.success(hospitals));
    }
}
