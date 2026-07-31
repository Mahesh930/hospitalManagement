package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.ChargeMaster;
import com.mahesh.hospitalManagement.entity.DiagnosisCatalogue;
import com.mahesh.hospitalManagement.entity.MedicineCatalogue;
import com.mahesh.hospitalManagement.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/master-data")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    @PostMapping("/medicines")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MedicineCatalogue>> addMedicine(@RequestBody MedicineCatalogue medicine) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicineCatalogue created = masterDataService.addMedicine(medicine, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Medicine added to catalogue"));
    }

    @GetMapping("/medicines")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineCatalogue>>> searchMedicines(@RequestParam(required = false) String query) {
        List<MedicineCatalogue> medicines = masterDataService.searchMedicines(query);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @PostMapping("/diagnoses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DiagnosisCatalogue>> addDiagnosis(@RequestBody DiagnosisCatalogue diagnosis) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DiagnosisCatalogue created = masterDataService.addDiagnosis(diagnosis, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "ICD-10 diagnosis added to catalogue"));
    }

    @GetMapping("/diagnoses")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DiagnosisCatalogue>>> searchDiagnoses(@RequestParam(required = false) String query) {
        List<DiagnosisCatalogue> list = masterDataService.searchDiagnoses(query);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/charges")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChargeMaster>> addChargeItem(@RequestBody ChargeMaster charge) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        ChargeMaster created = masterDataService.addChargeItem(charge, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Charge item added to charge master"));
    }

    @GetMapping("/charges")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<ChargeMaster>>> getAllCharges() {
        List<ChargeMaster> charges = masterDataService.getAllCharges();
        return ResponseEntity.ok(ApiResponse.success(charges));
    }
}
