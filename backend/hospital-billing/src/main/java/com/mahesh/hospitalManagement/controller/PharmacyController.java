package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.PharmacyStockMovement;
import com.mahesh.hospitalManagement.service.PharmacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for MediCore ERP Pharmacy Operations.
 * 
 * Logic Overview:
 * - Real-time Pharmacy Clinical Dashboard & Dispensing Metrics.
 * - Doctor Prescription Queue & Clinical Verification (Verification, Rejection, Clarification).
 * - FEFO Medicine Dispensing & Automatic Batch Inventory Stock Deduction.
 * - Inventory Batches, Storage Locations, and Near-Expiry Tracking.
 * - Stock Receipts (GRN) and Physical Audit Adjustments.
 * - Supplier Purchase Orders and Replenishment Tracking.
 * - Patient Medicine Returns (Restocking vs Quarantine Wastage).
 * - Regulatory Batch Recalls and Quarantine Control.
 * - Pharmacist Shift Handovers and Daily Analytical Reports.
 */
@RestController
@RequestMapping("/pharmacy")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    /**
     * Retrieves pharmacy dashboard metrics, queue snapshot, and stock/expiry alerts.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PharmacyDashboardDto>> getDashboard() {
        PharmacyDashboardDto dto = pharmacyService.getPharmacyDashboard();
        return ResponseEntity.ok(ApiResponse.success(dto, "Pharmacy dashboard loaded successfully"));
    }

    /**
     * Retrieves prescription queue with status filtering and patient search.
     */
    @GetMapping("/prescriptions")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<PrescriptionQueueItemDto>>> getPrescriptionQueue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query) {
        List<PrescriptionQueueItemDto> list = pharmacyService.getPrescriptionQueue(status, query);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Clinically verifies, clarifies, or rejects a doctor's prescription.
     */
    @PostMapping("/prescriptions/verify")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionQueueItemDto>> verifyPrescription(
            @Valid @RequestBody PrescriptionVerificationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PrescriptionQueueItemDto verified = pharmacyService.verifyPrescription(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(verified, "Prescription processed successfully"));
    }

    /**
     * Dispenses prescribed or OTC medicines, performing FEFO stock deduction and ledger logging.
     */
    @PostMapping("/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<DispenseResponseDto>> dispenseMedicines(
            @Valid @RequestBody DispenseRequestDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DispenseResponseDto response = pharmacyService.dispenseMedicines(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Medicines dispensed successfully"));
    }

    /**
     * Searches or lists medicine batches with FEFO ordering and near-expiry/low-stock filters.
     */
    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<MedicineBatchDto>>> getBatches(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean nearExpiryOnly,
            @RequestParam(required = false) Boolean lowStockOnly) {
        List<MedicineBatchDto> batches = pharmacyService.getMedicineBatches(query, nearExpiryOnly, lowStockOnly);
        return ResponseEntity.ok(ApiResponse.success(batches));
    }

    /**
     * Records new stock receipt into pharmacy batch inventory from suppliers.
     */
    @PostMapping("/batches/receipt")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineBatchDto>> addStockReceipt(
            @Valid @RequestBody StockReceiptDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicineBatchDto batch = pharmacyService.addStockReceipt(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(batch, "Stock received and added to inventory"));
    }

    /**
     * Adjusts batch stock due to physical audit variance, damage, or quarantine.
     */
    @PostMapping("/batches/adjustment")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineBatchDto>> adjustStock(
            @Valid @RequestBody StockAdjustmentDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicineBatchDto adjusted = pharmacyService.adjustStock(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(adjusted, "Stock adjusted successfully"));
    }

    /**
     * Lists supplier purchase replenishment orders.
     */
    @GetMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PurchaseOrderDto>>> getPurchaseOrders(
            @RequestParam(required = false) String status) {
        List<PurchaseOrderDto> list = pharmacyService.getPurchaseOrders(status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Creates a new pharmacy supplier purchase order.
     */
    @PostMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PurchaseOrderDto created = pharmacyService.createPurchaseOrder(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Purchase order created successfully"));
    }

    /**
     * Marks a purchase order as received.
     */
    @PostMapping("/purchase-orders/{poId}/receive")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> receivePurchaseOrder(@PathVariable UUID poId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PurchaseOrderDto received = pharmacyService.receivePurchaseOrder(poId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(received, "Purchase order marked as received"));
    }

    /**
     * Lists patient medicine returns.
     */
    @GetMapping("/returns")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PharmacyReturnDto>>> getMedicineReturns() {
        List<PharmacyReturnDto> list = pharmacyService.getMedicineReturns();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Records and processes patient medicine returns.
     */
    @PostMapping("/returns")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyReturnDto>> processMedicineReturn(
            @Valid @RequestBody PharmacyReturnDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PharmacyReturnDto processed = pharmacyService.processMedicineReturn(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(processed, "Medicine return processed successfully"));
    }

    /**
     * Lists regulatory and manufacturer medicine recalls.
     */
    @GetMapping("/recalls")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<MedicineRecallDto>>> getRecalls() {
        List<MedicineRecallDto> list = pharmacyService.getRecalls();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Initiates a batch recall and quarantines remaining stock.
     */
    @PostMapping("/recalls")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineRecallDto>> initiateBatchRecall(
            @Valid @RequestBody MedicineRecallDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicineRecallDto recall = pharmacyService.initiateBatchRecall(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(recall, "Batch recall initiated and stock quarantined"));
    }

    /**
     * Lists past pharmacy shift handovers.
     */
    @GetMapping("/shift-handovers")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PharmacyShiftHandoverDto>>> getShiftHandovers() {
        List<PharmacyShiftHandoverDto> list = pharmacyService.getShiftHandovers();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Records a new pharmacy shift handover report.
     */
    @PostMapping("/shift-handovers")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyShiftHandoverDto>> recordShiftHandover(
            @Valid @RequestBody PharmacyShiftHandoverDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PharmacyShiftHandoverDto saved = pharmacyService.recordShiftHandover(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved, "Shift handover recorded"));
    }

    /**
     * Retrieves pharmacy analytical dispensing and stock reports.
     */
    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyReportDto>> getPharmacyReports() {
        PharmacyReportDto report = pharmacyService.getPharmacyReports();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    /**
     * Retrieves stock movement audit trail.
     */
    @GetMapping("/movements")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PharmacyStockMovement>>> getStockMovements() {
        List<PharmacyStockMovement> list = pharmacyService.getStockMovements();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
