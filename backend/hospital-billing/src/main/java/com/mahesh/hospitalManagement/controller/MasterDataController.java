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

/**
 * REST Controller for managing clinical and financial Master Data catalogues.
 * 
 * Logic Overview:
 * 1. Medicine Catalogue: Preserved database of pharmaceutical drugs, dosages, and active ingredients used in e-prescribing.
 * 2. ICD-10 Diagnosis Catalogue: Standardized international disease classification catalog for clinical diagnostic coding.
 * 3. Charge Master: Hospital fee schedule containing standard tariffs for consultations, lab tests, beds, and procedures.
 */
@RestController
@RequestMapping("/master-data")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    /**
     * Adds a new pharmaceutical medicine entry to the master catalogue (ADMIN only).
     * 
     * @param medicine Medicine details payload.
     * @return ResponseEntity with saved MedicineCatalogue entity.
     */
    @PostMapping("/medicines")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MedicineCatalogue>> addMedicine(@RequestBody MedicineCatalogue medicine) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicineCatalogue created = masterDataService.addMedicine(medicine, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Medicine added to catalogue"));
    }

    /**
     * Searches or lists medicine entries by brand name or generic name.
     * 
     * @param query Search keyword string.
     * @return ResponseEntity containing list of matching medicines.
     */
    @GetMapping("/medicines")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineCatalogue>>> searchMedicines(@RequestParam(required = false) String query) {
        List<MedicineCatalogue> medicines = masterDataService.searchMedicines(query);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    /**
     * Registers a new ICD-10 diagnosis entry in the master catalogue.
     * 
     * @param diagnosis Diagnosis details payload.
     * @return ResponseEntity with saved DiagnosisCatalogue entity.
     */
    @PostMapping("/diagnoses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DiagnosisCatalogue>> addDiagnosis(@RequestBody DiagnosisCatalogue diagnosis) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DiagnosisCatalogue created = masterDataService.addDiagnosis(diagnosis, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "ICD-10 diagnosis added to catalogue"));
    }

    /**
     * Searches or lists ICD-10 diagnosis records.
     * 
     * @param query Search keyword string.
     * @return ResponseEntity containing list of matching diagnosis entries.
     */
    @GetMapping("/diagnoses")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DiagnosisCatalogue>>> searchDiagnoses(@RequestParam(required = false) String query) {
        List<DiagnosisCatalogue> list = masterDataService.searchDiagnoses(query);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Adds a new billable service tariff or item to the Charge Master catalogue.
     * 
     * @param charge ChargeMaster item details payload.
     * @return ResponseEntity with saved ChargeMaster entity.
     */
    @PostMapping("/charges")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChargeMaster>> addChargeItem(@RequestBody ChargeMaster charge) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        ChargeMaster created = masterDataService.addChargeItem(charge, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Charge item added to charge master"));
    }

    /**
     * Retrieves all billable charge master items for invoice generation.
     * 
     * @return ResponseEntity containing list of ChargeMaster items.
     */
    @GetMapping("/charges")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<ChargeMaster>>> getAllCharges() {
        List<ChargeMaster> charges = masterDataService.getAllCharges();
        return ResponseEntity.ok(ApiResponse.success(charges));
    }
}
