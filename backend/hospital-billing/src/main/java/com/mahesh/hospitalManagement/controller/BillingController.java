package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.InvoiceDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller managing hospital billing, invoice generation, discounts, payments, and refunds.
 * 
 * Logic & Transaction Rules:
 * 1. Idempotency Support: Accepts 'Idempotency-Key' request header to guarantee atomic, non-duplicate invoice generation.
 * 2. Consultation Auto-Itemization: Automatically pulls doctor fees, prescribed medicines, and procedure charges to construct invoice item lines.
 * 3. Discount Approval: Validates discount ceiling rules and records mandatory approval details.
 * 4. Payment Collection: Updates invoice status to PAID upon payment receipt.
 * 5. Refund Governance: Restricts refund processing exclusively to ADMIN users with required audit reason and approver.
 */
@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    /**
     * Generates a new invoice from a completed OPD consultation.
     * 
     * Logic Flow:
     * - Idempotency check: If an invoice was already processed with the provided Idempotency-Key, returns existing invoice.
     * - Calculates consultation fee + prescribed medicine prices from Master Data.
     * - Sets invoice status to UNPAID and saves line items.
     * 
     * @param consultationId Consultation UUID.
     * @param idempotencyKey Optional header to prevent duplicate charge submissions.
     * @return ResponseEntity holding generated InvoiceDto.
     */
    @PostMapping("/consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<InvoiceDto>> createInvoiceFromConsultation(
            @PathVariable UUID consultationId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InvoiceDto invoice = billingService.createInvoiceFromConsultation(consultationId, idempotencyKey, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(invoice, "Invoice generated successfully"));
    }

    /**
     * Applies a discount amount to an existing invoice prior to settlement.
     * 
     * Logic Flow:
     * - Recalculates net payable total: (Gross Amount - Discount Amount).
     * - Ensures discount amount does not exceed gross invoice total.
     * - Stores discount reason and approving authority identity in audit record.
     * 
     * @param invoiceId Invoice UUID.
     * @param discountAmount Monetary discount value to deduct.
     * @param discountReason Justification for concession.
     * @param approvedBy Name/ID of authority authorizing discount.
     * @return ResponseEntity containing updated InvoiceDto.
     */
    @PostMapping("/{invoiceId}/discount")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceDto>> applyDiscount(
            @PathVariable UUID invoiceId,
            @RequestParam Double discountAmount,
            @RequestParam(required = false) String discountReason,
            @RequestParam(required = false) String approvedBy) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InvoiceDto updated = billingService.applyDiscount(invoiceId, discountAmount, discountReason, approvedBy, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Discount applied successfully"));
    }

    /**
     * Records payment collection against an invoice.
     * 
     * Logic Flow:
     * - Validates invoice is in UNPAID or PARTIALLY_PAID state.
     * - Records payment method (CASH, CARD, UPI, INSURANCE).
     * - Transitions invoice status to PAID.
     * 
     * @param invoiceId Invoice UUID.
     * @param paymentMethod Mode of payment (default: CASH).
     * @return ResponseEntity containing paid InvoiceDto.
     */
    @PostMapping("/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceDto>> collectPayment(
            @PathVariable UUID invoiceId,
            @RequestParam(defaultValue = "CASH") String paymentMethod) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InvoiceDto paid = billingService.collectPayment(invoiceId, paymentMethod, currentUser);
        return ResponseEntity.ok(ApiResponse.success(paid, "Payment collected successfully"));
    }

    /**
     * Processes a full or partial refund for a paid invoice (ADMIN only).
     * 
     * Logic Flow:
     * - Restricted to ADMIN role for strict fiscal control.
     * - Verifies invoice is in PAID status.
     * - Reverses payment transaction and sets status to REFUNDED.
     * 
     * @param invoiceId Invoice UUID.
     * @param refundReason Mandatory reason for refunding.
     * @param approvedBy Administrator approving the refund.
     * @return ResponseEntity containing refunded InvoiceDto.
     */
    @PostMapping("/{invoiceId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceDto>> processRefund(
            @PathVariable UUID invoiceId,
            @RequestParam String refundReason,
            @RequestParam String approvedBy) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InvoiceDto refunded = billingService.processRefund(invoiceId, refundReason, approvedBy, currentUser);
        return ResponseEntity.ok(ApiResponse.success(refunded, "Refund processed successfully"));
    }

    /**
     * Retrieves invoice details by invoice ID.
     * 
     * @param invoiceId Unique invoice UUID.
     * @return ResponseEntity with InvoiceDto including all line items.
     */
    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoice(@PathVariable UUID invoiceId) {
        InvoiceDto invoice = billingService.getInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }
}
