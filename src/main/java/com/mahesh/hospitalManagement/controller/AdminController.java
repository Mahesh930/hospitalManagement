package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.DoctorService;
import com.mahesh.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PatientService patientService;
    private final DoctorService doctorService;

    @GetMapping("/patients/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PatientDto>>> searchPatients(@RequestParam(defaultValue = "") String query) {
        List<PatientDto> patients = patientService.searchPatients(query);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    @PostMapping("/onBoardNewDoctor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> onBoardNewDoctor(@RequestBody OnboardDoctorRequestDto dto) {
        DoctorResponseDto doctor = doctorService.onBoardNewDoctor(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(doctor, "Doctor onboarded successfully"));
    }
}
