package com.mahesh.hospitalManagement.controller;


import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.dto.PatientResponseDto;
import com.mahesh.hospitalManagement.service.DoctorService;
import com.mahesh.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final PatientService patientService;
    private final DoctorService doctorService;

    /**
     * Endpoint for administrators to retrieve a paginated list of all patients.
     * @param pageNumber The page number to retrieve (default: 0).
     * @param pageSize The number of records per page (default: 10).
     * @return ResponseEntity containing a list of PatientResponseDto.
     */
    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponseDto>> getAllPatients(
            @RequestParam(value = "page", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") Integer pageSize
    ) {
        return ResponseEntity.ok(patientService.getAllPatients(pageNumber, pageSize));
    }

    /**
     * Endpoint for administrators to onboard a new doctor.
     * @param onboardDoctorRequestDto Request body with user ID and doctor details.
     * @return ResponseEntity with the newly onboarded doctor's details.
     */
    @PostMapping("/onBoardNewDoctor")
    public ResponseEntity<DoctorResponseDto> onBoardNewDoctor(@RequestBody OnboardDoctorRequestDto onboardDoctorRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.onBoardNewDoctor(onboardDoctorRequestDto));
    }
}
