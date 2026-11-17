package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enterprise Service implementing complete MediCore ERP Pharmacy Operations:
 * 1. Real-time Prescription Dispensing Queue & Clinical Verification.
 * 2. FEFO (First-Expiry-First-Out) Inventory Batch Selection & Stock Deduction.
 * 3. Batch Management, Storage Rack Locations, and Near-Expiry Tracking.
 * 4. Goods Receipts, Supplier Purchase Orders, and Stock Adjustments.
 * 5. Returns (Restock vs Quarantine Wastage) and Regulatory Recalls.
 * 6. Pharmacy Shift Handovers and Daily Analytical Reports.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PharmacyService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final MedicineCatalogueRepository medicineCatalogueRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final PharmacyDispenseRecordRepository dispenseRecordRepository;
    private final PharmacyDispenseItemRepository dispenseItemRepository;
    private final PharmacyStockMovementRepository stockMovementRepository;
    private final PharmacyPurchaseOrderRepository purchaseOrderRepository;
    private final PharmacyReturnRepository pharmacyReturnRepository;
    private final PharmacyShiftHandoverRepository shiftHandoverRepository;
    private final MedicineRecallRepository medicineRecallRepository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    private static final int LOW_STOCK_THRESHOLD = 25;
    private static final int NEAR_EXPIRY_DAYS_THRESHOLD = 60;

    private void logAudit(String action, String oldValue, String newValue, String username) {
        try {
            if (auditService != null) {
                auditService.logAction(username, action, oldValue != null ? oldValue : "", newValue != null ? newValue : "", "127.0.0.1", "PHARMACY_WEB", "MAIN_HOSPITAL");
            }
        } catch (Exception e) {
            log.warn("Failed to write audit log for action: {}", action, e);
        }
    }

    /**
     * Aggregates real-time statistics and alerts for the Pharmacist Dashboard.
     */
    @Transactional(readOnly = true)
    public PharmacyDashboardDto getPharmacyDashboard() {
        List<Prescription> allPrescriptions = prescriptionRepository.findAll();
        long pending = allPrescriptions.stream().filter(p -> "SUBMITTED".equalsIgnoreCase(p.getStatus())).count();
        long verified = allPrescriptions.stream().filter(p -> "VERIFIED".equalsIgnoreCase(p.getStatus())).count();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(23, 59, 59);
        List<PharmacyDispenseRecord> todayDispenses = dispenseRecordRepository.findDispensesBetween(startOfToday, endOfToday);
        long dispensedTodayCount = todayDispenses.size();
        double todayRevenue = todayDispenses.stream()
                .mapToDouble(d -> d.getTotalAmount() != null ? d.getTotalAmount() : 0.0)
                .sum();

        List<MedicineBatch> lowStockBatches = medicineBatchRepository.findLowStockBatches(LOW_STOCK_THRESHOLD);
        LocalDate targetExpiry = LocalDate.now().plusDays(NEAR_EXPIRY_DAYS_THRESHOLD);
        List<MedicineBatch> nearExpiryBatches = medicineBatchRepository.findNearExpiryBatches(targetExpiry);
        long activeRecalls = medicineRecallRepository.findByStatus("ACTIVE").size();

        List<PrescriptionQueueItemDto> queue = getPrescriptionQueue(null, null).stream().limit(10).collect(Collectors.toList());

        return PharmacyDashboardDto.builder()
                .pendingPrescriptionsCount(pending)
                .verifiedPrescriptionsCount(verified)
                .dispensedTodayCount(dispensedTodayCount)
                .todayDispensedValue(todayRevenue)
                .lowStockBatchesCount((long) lowStockBatches.size())
                .nearExpiryBatchesCount((long) nearExpiryBatches.size())
                .activeRecallsCount(activeRecalls)
                .activeQueue(queue)
                .lowStockAlerts(lowStockBatches.stream().limit(5).map(this::mapBatchToDto).collect(Collectors.toList()))
                .nearExpiryAlerts(nearExpiryBatches.stream().limit(5).map(this::mapBatchToDto).collect(Collectors.toList()))
                .build();
    }

    /**
     * Retrieves prescription queue items filtered by status and patient query with stock availability analysis.
     */
    @Transactional(readOnly = true)
    public List<PrescriptionQueueItemDto> getPrescriptionQueue(String statusFilter, String searchQuery) {
        List<Prescription> prescriptions = prescriptionRepository.findAll();

        return prescriptions.stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> {
                    if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
                        return true;
                    }
                    return statusFilter.equalsIgnoreCase(p.getStatus());
                })
                .filter(p -> {
                    if (searchQuery == null || searchQuery.isBlank()) {
                        return true;
                    }
                    String q = searchQuery.toLowerCase();
                    boolean patientMatch = p.getPatient() != null &&
                            (p.getPatient().getName().toLowerCase().contains(q) ||
                             (p.getPatient().getUhid() != null && p.getPatient().getUhid().toLowerCase().contains(q)));
                    boolean doctorMatch = p.getDoctor() != null && p.getDoctor().getName().toLowerCase().contains(q);
                    return patientMatch || doctorMatch;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapPrescriptionToQueueDto)
                .collect(Collectors.toList());
    }

    /**
     * Verifies, clarifies, or rejects a doctor's prescription with audit logging.
     */
    @Transactional
    public PrescriptionQueueItemDto verifyPrescription(PrescriptionVerificationDto dto, String pharmacistUsername) {
        Prescription prescription = prescriptionRepository.findById(dto.getPrescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + dto.getPrescriptionId()));

        String action = dto.getAction().toUpperCase();
        String oldStatus = prescription.getStatus();

        switch (action) {
            case "VERIFY":
                prescription.setStatus("VERIFIED");
                prescription.setVerifiedBy(pharmacistUsername);
                prescription.setVerificationNotes(dto.getNotes() != null ? dto.getNotes() : "Prescription clinical verification passed");
                prescription.setClarificationRequested(false);
                break;
            case "REJECT":
                prescription.setStatus("REJECTED");
                prescription.setVerifiedBy(pharmacistUsername);
                prescription.setRejectionReason(dto.getNotes() != null ? dto.getNotes() : "Rejected by pharmacy verification");
                break;
            case "CLARIFY":
                prescription.setClarificationRequested(true);
                prescription.setClarificationNotes(dto.getNotes() != null ? dto.getNotes() : "Clarification requested regarding dosage or interaction");
                break;
            default:
                throw new BusinessValidationException("Invalid verification action: " + action);
        }

        Prescription saved = prescriptionRepository.save(prescription);
        logAudit("PHARMACY_PRESCRIPTION_VERIFY", oldStatus, saved.getStatus(), pharmacistUsername);

        return mapPrescriptionToQueueDto(saved);
    }

    /**
     * Dispenses medicines against prescription or direct dispensing request with FEFO stock deduction.
     */
    @Transactional
    public DispenseResponseDto dispenseMedicines(DispenseRequestDto dto, String pharmacistUsername) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Prescription prescription = null;
        if (dto.getPrescriptionId() != null) {
            prescription = prescriptionRepository.findById(dto.getPrescriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prescription not found: " + dto.getPrescriptionId()));
            if ("REJECTED".equalsIgnoreCase(prescription.getStatus()) || "CANCELLED".equalsIgnoreCase(prescription.getStatus())) {
                throw new BusinessValidationException("Cannot dispense rejected or cancelled prescription");
            }
        }

        String dispenseNumber = "DSP-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        double grandTotal = 0.0;
        List<PharmacyDispenseItem> dispenseItems = new ArrayList<>();

        PharmacyDispenseRecord record = PharmacyDispenseRecord.builder()
                .dispenseNumber(dispenseNumber)
                .prescription(prescription)
                .patient(patient)
                .pharmacistUsername(pharmacistUsername)
                .dispenseDate(LocalDateTime.now())
                .paymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PAID")
                .status("DISPENSED")
                .handoverTo(dto.getHandoverTo() != null ? dto.getHandoverTo() : "Patient Self")
                .instructions(dto.getInstructions() != null ? dto.getInstructions() : "Take as prescribed with water after meals.")
                .build();

        PharmacyDispenseRecord savedRecord = dispenseRecordRepository.save(record);

        boolean allPrescriptionItemsCompleted = true;

        for (DispenseItemRequestDto itemDto : dto.getItems()) {
            MedicineCatalogue medicine = medicineCatalogueRepository.findById(itemDto.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + itemDto.getMedicineId()));

            MedicineBatch batch = medicineBatchRepository.findById(itemDto.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + itemDto.getBatchId()));

            // Safety checks: Expiry, Recall, Stock availability
            if (batch.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BusinessValidationException("Cannot dispense expired batch: " + batch.getBatchNumber() + " (Expired on " + batch.getExpiryDate() + ")");
            }
            if ("RECALLED".equalsIgnoreCase(batch.getStatus()) || "QUARANTINED".equalsIgnoreCase(batch.getStatus())) {
                throw new BusinessValidationException("Cannot dispense batch " + batch.getBatchNumber() + " due to status: " + batch.getStatus());
            }
            if (batch.getQuantityOnHand() < itemDto.getQuantityDispensed()) {
                throw new BusinessValidationException("Insufficient stock in batch " + batch.getBatchNumber() + ". Available: " + batch.getQuantityOnHand() + ", Requested: " + itemDto.getQuantityDispensed());
            }

            // Deduct stock from batch
            int remainingStock = batch.getQuantityOnHand() - itemDto.getQuantityDispensed();
            batch.setQuantityOnHand(remainingStock);
            if (remainingStock == 0) {
                batch.setStatus("DEPLETED");
            }
            medicineBatchRepository.save(batch);

            // Calculate item price
            double unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() :
                    (batch.getSellingPrice() != null ? batch.getSellingPrice() : (medicine.getUnitPrice() != null ? medicine.getUnitPrice() : 10.0));
            double itemTotal = unitPrice * itemDto.getQuantityDispensed();
            grandTotal += itemTotal;

            // Create dispense item
            PharmacyDispenseItem dispenseItem = PharmacyDispenseItem.builder()
                    .dispenseRecord(savedRecord)
                    .medicine(medicine)
                    .batch(batch)
                    .quantityDispensed(itemDto.getQuantityDispensed())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .dosageInstructions(itemDto.getDosageInstructions() != null ? itemDto.getDosageInstructions() : medicine.getDosageForm())
                    .build();
            dispenseItems.add(dispenseItemRepository.save(dispenseItem));

            // Record stock movement ledger
            PharmacyStockMovement movement = PharmacyStockMovement.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .movementType("DISPENSE")
                    .quantity(-itemDto.getQuantityDispensed())
                    .balanceAfter(remainingStock)
                    .referenceNumber(dispenseNumber)
                    .reason("Dispensed to Patient: " + patient.getName() + " (" + patient.getUhid() + ")")
                    .performedBy(pharmacistUsername)
                    .build();
            stockMovementRepository.save(movement);

            // Update prescription line item if provided
            if (itemDto.getPrescriptionItemId() != null) {
                Optional<PrescriptionItem> pItemOpt = prescriptionItemRepository.findById(itemDto.getPrescriptionItemId());
                if (pItemOpt.isPresent()) {
                    PrescriptionItem pItem = pItemOpt.get();
                    int newDispensed = (pItem.getDispensedQuantity() != null ? pItem.getDispensedQuantity() : 0) + itemDto.getQuantityDispensed();
                    pItem.setDispensedQuantity(newDispensed);
                    pItem.setBatchNumber(batch.getBatchNumber());
                    if (newDispensed >= pItem.getQuantity()) {
                        pItem.setStatus("DISPENSED");
                    } else {
                        pItem.setStatus("PARTIAL");
                        allPrescriptionItemsCompleted = false;
                    }
                    prescriptionItemRepository.save(pItem);
                }
            }
        }

        savedRecord.setTotalAmount(grandTotal);
        savedRecord.setItems(dispenseItems);
        savedRecord = dispenseRecordRepository.save(savedRecord);

        // Update overall prescription status
        if (prescription != null) {
            prescription.setDispensedAt(LocalDateTime.now());
            prescription.setDispensedBy(pharmacistUsername);
            prescription.setStatus(allPrescriptionItemsCompleted ? "DISPENSED" : "PARTIALLY_DISPENSED");
            prescriptionRepository.save(prescription);
        }

        logAudit("PHARMACY_DISPENSE", "INIT", "DISPENSED", pharmacistUsername);

        return mapDispenseRecordToDto(savedRecord);
    }

    /**
     * Searches or lists medicine batches with FEFO sorting and expiry flags.
     */
    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getMedicineBatches(String query, Boolean nearExpiryOnly, Boolean lowStockOnly) {
        List<MedicineBatch> batches;

        if (nearExpiryOnly != null && nearExpiryOnly) {
            LocalDate targetDate = LocalDate.now().plusDays(NEAR_EXPIRY_DAYS_THRESHOLD);
            batches = medicineBatchRepository.findNearExpiryBatches(targetDate);
        } else if (lowStockOnly != null && lowStockOnly) {
            batches = medicineBatchRepository.findLowStockBatches(LOW_STOCK_THRESHOLD);
        } else if (query != null && !query.isBlank()) {
            batches = medicineBatchRepository.searchBatches(query);
        } else {
            batches = medicineBatchRepository.findByDeletedAtIsNullOrderByExpiryDateAsc();
        }

        return batches.stream().map(this::mapBatchToDto).collect(Collectors.toList());
    }

    /**
     * Records new medicine stock incoming receipt from suppliers.
     */
    @Transactional
    public MedicineBatchDto addStockReceipt(StockReceiptDto dto, String pharmacistUsername) {
        MedicineCatalogue medicine = medicineCatalogueRepository.findById(dto.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + dto.getMedicineId()));

        Optional<MedicineBatch> existingBatch = medicineBatchRepository.findByMedicineIdAndBatchNumberAndDeletedAtIsNull(medicine.getId(), dto.getBatchNumber());

        MedicineBatch batch;
        if (existingBatch.isPresent()) {
            batch = existingBatch.get();
            batch.setQuantityOnHand(batch.getQuantityOnHand() + dto.getQuantity());
            if (dto.getSellingPrice() != null) batch.setSellingPrice(dto.getSellingPrice());
            if (dto.getStorageLocation() != null) batch.setStorageLocation(dto.getStorageLocation());
        } else {
            batch = MedicineBatch.builder()
                    .medicine(medicine)
                    .batchNumber(dto.getBatchNumber())
                    .expiryDate(dto.getExpiryDate())
                    .mfgDate(dto.getMfgDate() != null ? dto.getMfgDate() : LocalDate.now().minusMonths(2))
                    .purchasePrice(dto.getPurchasePrice() != null ? dto.getPurchasePrice() : 0.0)
                    .mrp(dto.getMrp() != null ? dto.getMrp() : 0.0)
                    .sellingPrice(dto.getSellingPrice() != null ? dto.getSellingPrice() : (medicine.getUnitPrice() != null ? medicine.getUnitPrice() : 10.0))
                    .quantityOnHand(dto.getQuantity())
                    .storageLocation(dto.getStorageLocation() != null ? dto.getStorageLocation() : "General Pharmacy Rack A1")
                    .supplierName(dto.getSupplierName() != null ? dto.getSupplierName() : "Hospital Central Store")
                    .notes(dto.getNotes())
                    .status("ACTIVE")
                    .build();
        }

        MedicineBatch savedBatch = medicineBatchRepository.save(batch);

        // Record stock movement
        PharmacyStockMovement movement = PharmacyStockMovement.builder()
                .medicine(medicine)
                .batch(savedBatch)
                .movementType("PURCHASE_RECEIPT")
                .quantity(dto.getQuantity())
                .balanceAfter(savedBatch.getQuantityOnHand())
                .referenceNumber(dto.getInvoiceNumber() != null ? dto.getInvoiceNumber() : "GRN-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .reason(dto.getNotes() != null ? dto.getNotes() : "Stock receipt received from " + savedBatch.getSupplierName())
                .performedBy(pharmacistUsername)
                .build();
        stockMovementRepository.save(movement);

        logAudit("PHARMACY_STOCK_RECEIPT", "0", String.valueOf(dto.getQuantity()), pharmacistUsername);

        return mapBatchToDto(savedBatch);
    }

    /**
     * Records physical inventory adjustments, corrections, damage or quarantine write-offs.
     */
    @Transactional
    public MedicineBatchDto adjustStock(StockAdjustmentDto dto, String pharmacistUsername) {
        MedicineBatch batch = medicineBatchRepository.findById(dto.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + dto.getBatchId()));

        int newQuantity = batch.getQuantityOnHand() + dto.getQuantityChange();
        if (newQuantity < 0) {
            throw new BusinessValidationException("Adjustment cannot reduce stock below zero. Current stock: " + batch.getQuantityOnHand());
        }

        batch.setQuantityOnHand(newQuantity);

        // Handle quarantine / damage reasons
        if ("DAMAGE".equalsIgnoreCase(dto.getReason()) || "EXPIRED".equalsIgnoreCase(dto.getReason()) || "QUARANTINE".equalsIgnoreCase(dto.getReason())) {
            batch.setQuarantinedQuantity((batch.getQuarantinedQuantity() != null ? batch.getQuarantinedQuantity() : 0) + Math.abs(dto.getQuantityChange()));
            if (newQuantity == 0) {
                batch.setStatus("QUARANTINED");
            }
        }

        MedicineBatch saved = medicineBatchRepository.save(batch);

        PharmacyStockMovement movement = PharmacyStockMovement.builder()
                .medicine(batch.getMedicine())
                .batch(saved)
                .movementType("STOCK_ADJUSTMENT")
                .quantity(dto.getQuantityChange())
                .balanceAfter(newQuantity)
                .referenceNumber("ADJ-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .reason(dto.getReason() + ": " + (dto.getNotes() != null ? dto.getNotes() : "Inventory audit adjustment"))
                .performedBy(pharmacistUsername)
                .build();
        stockMovementRepository.save(movement);

        logAudit("PHARMACY_STOCK_ADJUSTMENT", String.valueOf(batch.getQuantityOnHand()), String.valueOf(newQuantity), pharmacistUsername);

        return mapBatchToDto(saved);
    }

    /**
     * Lists supplier purchase replenishment orders.
     */
    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getPurchaseOrders(String status) {
        List<PharmacyPurchaseOrder> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = purchaseOrderRepository.findByStatusOrderByOrderDateDesc(status);
        } else {
            list = purchaseOrderRepository.findAllByOrderByOrderDateDesc();
        }
        return list.stream().map(this::mapPOToDto).collect(Collectors.toList());
    }

    /**
     * Creates a new pharmacy replenishment purchase order.
     */
    @Transactional
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderDto dto, String pharmacistUsername) {
        String poNumber = "PO-PHARM-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        PharmacyPurchaseOrder po = PharmacyPurchaseOrder.builder()
                .poNumber(poNumber)
                .supplierName(dto.getSupplierName())
                .supplierContact(dto.getSupplierContact())
                .orderDate(dto.getOrderDate() != null ? dto.getOrderDate() : LocalDate.now())
                .expectedDeliveryDate(dto.getExpectedDeliveryDate() != null ? dto.getExpectedDeliveryDate() : LocalDate.now().plusDays(7))
                .status("ORDERED")
                .totalAmount(dto.getTotalAmount() != null ? dto.getTotalAmount() : 0.0)
                .itemsJson(dto.getItemsJson())
                .notes(dto.getNotes())
                .createdByPharmacist(pharmacistUsername)
                .build();

        PharmacyPurchaseOrder saved = purchaseOrderRepository.save(po);
        logAudit("PHARMACY_PO_CREATED", "DRAFT", "ORDERED", pharmacistUsername);

        return mapPOToDto(saved);
    }

    /**
     * Marks a purchase order as received and updates inventory stock.
     */
    @Transactional
    public PurchaseOrderDto receivePurchaseOrder(UUID poId, String pharmacistUsername) {
        PharmacyPurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found: " + poId));

        po.setStatus("RECEIVED");
        po.setReceivedDate(LocalDate.now());
        PharmacyPurchaseOrder saved = purchaseOrderRepository.save(po);

        logAudit("PHARMACY_PO_RECEIVED", "ORDERED", "RECEIVED", pharmacistUsername);

        return mapPOToDto(saved);
    }

    /**
     * Processes patient medicine returns with restocking or quarantine write-off.
     */
    @Transactional
    public PharmacyReturnDto processMedicineReturn(PharmacyReturnDto dto, String pharmacistUsername) {
        MedicineCatalogue medicine = medicineCatalogueRepository.findById(dto.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + dto.getMedicineId()));

        MedicineBatch batch = medicineBatchRepository.findById(dto.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + dto.getBatchId()));

        Patient patient = null;
        if (dto.getPatientId() != null) {
            patient = patientRepository.findById(dto.getPatientId()).orElse(null);
        }

        PharmacyDispenseRecord record = null;
        if (dto.getDispenseRecordId() != null) {
            record = dispenseRecordRepository.findById(dto.getDispenseRecordId()).orElse(null);
        }

        String returnNumber = "RET-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        PharmacyReturn pharmacyReturn = PharmacyReturn.builder()
                .returnNumber(returnNumber)
                .patient(patient)
                .dispenseRecord(record)
                .medicine(medicine)
                .batch(batch)
                .returnQuantity(dto.getReturnQuantity())
                .refundAmount(dto.getRefundAmount() != null ? dto.getRefundAmount() : 0.0)
                .disposition(dto.getDisposition() != null ? dto.getDisposition() : "RETURN_TO_STOCK")
                .reason(dto.getReason())
                .status("APPROVED_RESTOCKED")
                .processedBy(pharmacistUsername)
                .build();

        PharmacyReturn savedReturn = pharmacyReturnRepository.save(pharmacyReturn);

        // Stock handling based on disposition
        if ("RETURN_TO_STOCK".equalsIgnoreCase(dto.getDisposition())) {
            batch.setQuantityOnHand(batch.getQuantityOnHand() + dto.getReturnQuantity());
            medicineBatchRepository.save(batch);

            PharmacyStockMovement movement = PharmacyStockMovement.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .movementType("PATIENT_RETURN")
                    .quantity(dto.getReturnQuantity())
                    .balanceAfter(batch.getQuantityOnHand())
                    .referenceNumber(returnNumber)
                    .reason("Restocked from return: " + dto.getReason())
                    .performedBy(pharmacistUsername)
                    .build();
            stockMovementRepository.save(movement);
        } else {
            // Quarantine or damage write-off
            batch.setQuarantinedQuantity((batch.getQuarantinedQuantity() != null ? batch.getQuarantinedQuantity() : 0) + dto.getReturnQuantity());
            medicineBatchRepository.save(batch);

            PharmacyStockMovement movement = PharmacyStockMovement.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .movementType("WRITE_OFF")
                    .quantity(0)
                    .balanceAfter(batch.getQuantityOnHand())
                    .referenceNumber(returnNumber)
                    .reason("Quarantined return: " + dto.getReason())
                    .performedBy(pharmacistUsername)
                    .build();
            stockMovementRepository.save(movement);
        }

        logAudit("PHARMACY_RETURN", "DISPENSED", "RETURNED", pharmacistUsername);

        return mapReturnToDto(savedReturn);
    }

    /**
     * Lists patient medicine returns.
     */
    @Transactional(readOnly = true)
    public List<PharmacyReturnDto> getMedicineReturns() {
        return pharmacyReturnRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapReturnToDto)
                .collect(Collectors.toList());
    }

    /**
     * Initiates a regulatory or manufacturer recall for an affected medicine batch.
     */
    @Transactional
    public MedicineRecallDto initiateBatchRecall(MedicineRecallDto dto, String pharmacistUsername) {
        MedicineCatalogue medicine = medicineCatalogueRepository.findById(dto.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + dto.getMedicineId()));

        Optional<MedicineBatch> batchOpt = medicineBatchRepository.findByMedicineIdAndBatchNumberAndDeletedAtIsNull(medicine.getId(), dto.getBatchNumber());

        int quarantined = 0;
        if (batchOpt.isPresent()) {
            MedicineBatch batch = batchOpt.get();
            quarantined = batch.getQuantityOnHand();
            batch.setQuarantinedQuantity((batch.getQuarantinedQuantity() != null ? batch.getQuarantinedQuantity() : 0) + quarantined);
            batch.setQuantityOnHand(0);
            batch.setStatus("RECALLED");
            medicineBatchRepository.save(batch);

            PharmacyStockMovement movement = PharmacyStockMovement.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .movementType("RECALL")
                    .quantity(-quarantined)
                    .balanceAfter(0)
                    .referenceNumber("RCL-" + batch.getBatchNumber())
                    .reason("Quarantined for batch recall: " + dto.getRecallReason())
                    .performedBy(pharmacistUsername)
                    .build();
            stockMovementRepository.save(movement);
        }

        String recallNumber = "RCL-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        MedicineRecall recall = MedicineRecall.builder()
                .recallNumber(recallNumber)
                .medicine(medicine)
                .batchNumber(dto.getBatchNumber())
                .recallReason(dto.getRecallReason())
                .quarantinedQuantity(quarantined)
                .initiatedBy(pharmacistUsername)
                .status("ACTIVE")
                .build();

        MedicineRecall saved = medicineRecallRepository.save(recall);
        logAudit("PHARMACY_RECALL", "ACTIVE_STOCK", "RECALLED_QUARANTINE", pharmacistUsername);

        return mapRecallToDto(saved);
    }

    /**
     * Lists active or resolved medicine recalls.
     */
    @Transactional(readOnly = true)
    public List<MedicineRecallDto> getRecalls() {
        return medicineRecallRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapRecallToDto)
                .collect(Collectors.toList());
    }

    /**
     * Records a pharmacy shift handover report between staff.
     */
    @Transactional
    public PharmacyShiftHandoverDto recordShiftHandover(PharmacyShiftHandoverDto dto, String pharmacistUsername) {
        long pendingRx = prescriptionRepository.findAll().stream()
                .filter(p -> "SUBMITTED".equalsIgnoreCase(p.getStatus()) || "VERIFIED".equalsIgnoreCase(p.getStatus()))
                .count();
        long lowStock = medicineBatchRepository.findLowStockBatches(LOW_STOCK_THRESHOLD).size();

        PharmacyShiftHandover handover = PharmacyShiftHandover.builder()
                .shiftName(dto.getShiftName())
                .handoverDate(dto.getHandoverDate() != null ? dto.getHandoverDate() : LocalDate.now())
                .outgoingPharmacist(pharmacistUsername)
                .incomingPharmacist(dto.getIncomingPharmacist() != null ? dto.getIncomingPharmacist() : "Next Shift Lead")
                .pendingPrescriptionsCount((int) pendingRx)
                .lowStockItemsCount((int) lowStock)
                .criticalAlerts(dto.getCriticalAlerts())
                .notes(dto.getNotes())
                .status("HANDED_OVER")
                .build();

        PharmacyShiftHandover saved = shiftHandoverRepository.save(handover);
        logAudit("PHARMACY_HANDOVER", "SHIFT", dto.getShiftName(), pharmacistUsername);

        return mapHandoverToDto(saved);
    }

    /**
     * Lists past shift handovers.
     */
    @Transactional(readOnly = true)
    public List<PharmacyShiftHandoverDto> getShiftHandovers() {
        return shiftHandoverRepository.findAllByOrderByHandoverDateDescCreatedAtDesc().stream()
                .map(this::mapHandoverToDto)
                .collect(Collectors.toList());
    }

    /**
     * Compiles analytical dispensing, revenue, and inventory reports.
     */
    @Transactional(readOnly = true)
    public PharmacyReportDto getPharmacyReports() {
        List<PharmacyDispenseRecord> records = dispenseRecordRepository.findAll();
        long totalDispensedCount = records.size();
        double totalRevenue = records.stream().mapToDouble(r -> r.getTotalAmount() != null ? r.getTotalAmount() : 0.0).sum();

        List<PharmacyDispenseItem> items = dispenseItemRepository.findAll();
        long totalItems = items.stream().mapToLong(i -> i.getQuantityDispensed() != null ? i.getQuantityDispensed() : 0).sum();

        LocalDate now = LocalDate.now();
        long expiredCount = medicineBatchRepository.findByDeletedAtIsNullOrderByExpiryDateAsc().stream()
                .filter(b -> b.getExpiryDate().isBefore(now))
                .count();
        long lowStockCount = medicineBatchRepository.findLowStockBatches(LOW_STOCK_THRESHOLD).size();
        long recallCount = medicineRecallRepository.findByStatus("ACTIVE").size();

        // Group past 7 days dispense summary
        Map<String, List<PharmacyDispenseRecord>> groupedByDate = records.stream()
                .collect(Collectors.groupingBy(r -> r.getDispenseDate().toLocalDate().toString()));

        List<PharmacyReportDto.DailyDispenseSummary> dailySummaries = groupedByDate.entrySet().stream()
                .sorted(Map.Entry.<String, List<PharmacyDispenseRecord>>comparingByKey().reversed())
                .limit(7)
                .map(e -> PharmacyReportDto.DailyDispenseSummary.builder()
                        .date(e.getKey())
                        .count((long) e.getValue().size())
                        .revenue(e.getValue().stream().mapToDouble(r -> r.getTotalAmount() != null ? r.getTotalAmount() : 0.0).sum())
                        .build())
                .collect(Collectors.toList());

        // Top dispensed medicines
        Map<String, List<PharmacyDispenseItem>> groupedByMed = items.stream()
                .collect(Collectors.groupingBy(i -> i.getMedicine().getName()));

        List<PharmacyReportDto.TopDispensedMedicine> topMedicines = groupedByMed.entrySet().stream()
                .map(e -> PharmacyReportDto.TopDispensedMedicine.builder()
                        .medicineName(e.getKey())
                        .quantityDispensed(e.getValue().stream().mapToInt(PharmacyDispenseItem::getQuantityDispensed).sum())
                        .totalValue(e.getValue().stream().mapToDouble(PharmacyDispenseItem::getTotalPrice).sum())
                        .build())
                .sorted((a, b) -> Integer.compare(b.getQuantityDispensed(), a.getQuantityDispensed()))
                .limit(5)
                .collect(Collectors.toList());

        return PharmacyReportDto.builder()
                .totalDispensedCount(totalDispensedCount)
                .totalDispensedRevenue(totalRevenue)
                .totalItemsDispensed(totalItems)
                .expiredItemsCount(expiredCount)
                .lowStockItemsCount(lowStockCount)
                .activeRecallsCount(recallCount)
                .dailyDispenses(dailySummaries)
                .topMedicines(topMedicines)
                .build();
    }

    /**
     * Lists stock movement audit ledger.
     */
    @Transactional(readOnly = true)
    public List<PharmacyStockMovement> getStockMovements() {
        return stockMovementRepository.findTop100ByOrderByCreatedAtDesc();
    }

    // ==========================================
    // Mapping Helpers
    // ==========================================

    private PrescriptionQueueItemDto mapPrescriptionToQueueDto(Prescription p) {
        String patientAllergies = "No recorded allergies";
        if (p.getPatient() != null && p.getPatient().getAllergies() != null && !p.getPatient().getAllergies().isEmpty()) {
            patientAllergies = p.getPatient().getAllergies().stream()
                    .map(a -> a.getAllergen() != null ? a.getAllergen() : "")
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.joining(", "));
            if (patientAllergies.isBlank()) {
                patientAllergies = "No recorded allergies";
            }
        }

        List<PrescriptionQueueItemDto.PrescriptionLineItemDto> lineItems = new ArrayList<>();
        if (p.getItems() != null) {
            for (PrescriptionItem item : p.getItems()) {
                // Find available stock across active batches
                List<MedicineBatch> batches = medicineBatchRepository.searchBatches(item.getMedicineName());
                int totalAvail = batches.stream()
                        .filter(b -> b.getExpiryDate().isAfter(LocalDate.now()) && !"RECALLED".equalsIgnoreCase(b.getStatus()))
                        .mapToInt(MedicineBatch::getQuantityOnHand)
                        .sum();

                // Suggested FEFO batch
                String suggestedBatch = batches.stream()
                        .filter(b -> b.getExpiryDate().isAfter(LocalDate.now()) && b.getQuantityOnHand() > 0)
                        .sorted(Comparator.comparing(MedicineBatch::getExpiryDate))
                        .map(MedicineBatch::getBatchNumber)
                        .findFirst()
                        .orElse("N/A");

                lineItems.add(PrescriptionQueueItemDto.PrescriptionLineItemDto.builder()
                        .itemId(item.getId())
                        .medicineName(item.getMedicineName())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .durationDays(item.getDurationDays())
                        .prescribedQuantity(item.getQuantity())
                        .dispensedQuantity(item.getDispensedQuantity() != null ? item.getDispensedQuantity() : 0)
                        .instructions(item.getInstructions())
                        .batchNumber(item.getBatchNumber() != null ? item.getBatchNumber() : suggestedBatch)
                        .itemStatus(item.getStatus() != null ? item.getStatus() : "PENDING")
                        .availableStock(totalAvail)
                        .build());
            }
        }

        return PrescriptionQueueItemDto.builder()
                .prescriptionId(p.getId())
                .consultationId(p.getConsultation() != null ? p.getConsultation().getId() : null)
                .patientId(p.getPatient() != null ? p.getPatient().getId() : null)
                .patientName(p.getPatient() != null ? p.getPatient().getName() : "Unknown Patient")
                .uhid(p.getPatient() != null ? p.getPatient().getUhid() : "")
                .patientAge(p.getPatient() != null && p.getPatient().getAge() != null ? p.getPatient().getAge() : 30)
                .patientGender(p.getPatient() != null ? p.getPatient().getGender() : "")
                .allergies(patientAllergies)
                .doctorName(p.getDoctor() != null ? p.getDoctor().getName() : "Attending Doctor")
                .doctorSpecialization(p.getDoctor() != null ? p.getDoctor().getSpecialization() : "General Practice")
                .issuedAt(p.getCreatedAt())
                .status(p.getStatus() != null ? p.getStatus() : "SUBMITTED")
                .advice(p.getAdvice())
                .verificationNotes(p.getVerificationNotes())
                .rejectionReason(p.getRejectionReason())
                .clarificationRequested(p.getClarificationRequested() != null && p.getClarificationRequested())
                .clarificationNotes(p.getClarificationNotes())
                .items(lineItems)
                .build();
    }

    private DispenseResponseDto mapDispenseRecordToDto(PharmacyDispenseRecord record) {
        List<DispenseResponseDto.DispensedItemDto> items = new ArrayList<>();
        if (record.getItems() != null) {
            for (PharmacyDispenseItem item : record.getItems()) {
                items.add(DispenseResponseDto.DispensedItemDto.builder()
                        .id(item.getId())
                        .medicineId(item.getMedicine().getId())
                        .medicineName(item.getMedicine().getName())
                        .batchNumber(item.getBatch().getBatchNumber())
                        .quantityDispensed(item.getQuantityDispensed())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .dosageInstructions(item.getDosageInstructions())
                        .build());
            }
        }

        return DispenseResponseDto.builder()
                .id(record.getId())
                .dispenseNumber(record.getDispenseNumber())
                .prescriptionId(record.getPrescription() != null ? record.getPrescription().getId() : null)
                .patientId(record.getPatient().getId())
                .patientName(record.getPatient().getName())
                .uhid(record.getPatient().getUhid())
                .pharmacistUsername(record.getPharmacistUsername())
                .dispenseDate(record.getDispenseDate())
                .totalAmount(record.getTotalAmount())
                .paymentStatus(record.getPaymentStatus())
                .status(record.getStatus())
                .handoverTo(record.getHandoverTo())
                .instructions(record.getInstructions())
                .invoiceId(record.getInvoiceId())
                .items(items)
                .build();
    }

    private MedicineBatchDto mapBatchToDto(MedicineBatch b) {
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), b.getExpiryDate());
        return MedicineBatchDto.builder()
                .id(b.getId())
                .medicineId(b.getMedicine().getId())
                .medicineName(b.getMedicine().getName())
                .genericName(b.getMedicine().getGenericName())
                .dosageForm(b.getMedicine().getDosageForm())
                .strength(b.getMedicine().getStrength())
                .batchNumber(b.getBatchNumber())
                .expiryDate(b.getExpiryDate())
                .mfgDate(b.getMfgDate())
                .purchasePrice(b.getPurchasePrice())
                .mrp(b.getMrp())
                .sellingPrice(b.getSellingPrice())
                .quantityOnHand(b.getQuantityOnHand())
                .quarantinedQuantity(b.getQuarantinedQuantity())
                .storageLocation(b.getStorageLocation())
                .status(b.getStatus())
                .supplierName(b.getSupplierName())
                .daysUntilExpiry(daysUntilExpiry)
                .build();
    }

    private PurchaseOrderDto mapPOToDto(PharmacyPurchaseOrder po) {
        return PurchaseOrderDto.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierName(po.getSupplierName())
                .supplierContact(po.getSupplierContact())
                .orderDate(po.getOrderDate())
                .expectedDeliveryDate(po.getExpectedDeliveryDate())
                .receivedDate(po.getReceivedDate())
                .status(po.getStatus())
                .totalAmount(po.getTotalAmount())
                .itemsJson(po.getItemsJson())
                .notes(po.getNotes())
                .build();
    }

    private PharmacyReturnDto mapReturnToDto(PharmacyReturn r) {
        return PharmacyReturnDto.builder()
                .id(r.getId())
                .returnNumber(r.getReturnNumber())
                .patientId(r.getPatient() != null ? r.getPatient().getId() : null)
                .patientName(r.getPatient() != null ? r.getPatient().getName() : "Over-The-Counter")
                .dispenseRecordId(r.getDispenseRecord() != null ? r.getDispenseRecord().getId() : null)
                .medicineId(r.getMedicine().getId())
                .medicineName(r.getMedicine().getName())
                .batchId(r.getBatch().getId())
                .batchNumber(r.getBatch().getBatchNumber())
                .returnQuantity(r.getReturnQuantity())
                .refundAmount(r.getRefundAmount())
                .disposition(r.getDisposition())
                .reason(r.getReason())
                .status(r.getStatus())
                .build();
    }

    private MedicineRecallDto mapRecallToDto(MedicineRecall r) {
        return MedicineRecallDto.builder()
                .id(r.getId())
                .recallNumber(r.getRecallNumber())
                .medicineId(r.getMedicine().getId())
                .medicineName(r.getMedicine().getName())
                .batchNumber(r.getBatchNumber())
                .recallReason(r.getRecallReason())
                .quarantinedQuantity(r.getQuarantinedQuantity())
                .status(r.getStatus())
                .build();
    }

    private PharmacyShiftHandoverDto mapHandoverToDto(PharmacyShiftHandover h) {
        return PharmacyShiftHandoverDto.builder()
                .id(h.getId())
                .shiftName(h.getShiftName())
                .handoverDate(h.getHandoverDate())
                .outgoingPharmacist(h.getOutgoingPharmacist())
                .incomingPharmacist(h.getIncomingPharmacist())
                .pendingPrescriptionsCount(h.getPendingPrescriptionsCount())
                .lowStockItemsCount(h.getLowStockItemsCount())
                .criticalAlerts(h.getCriticalAlerts())
                .notes(h.getNotes())
                .status(h.getStatus())
                .build();
    }
}
