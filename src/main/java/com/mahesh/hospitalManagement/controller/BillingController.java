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

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

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

    @PostMapping("/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceDto>> collectPayment(
            @PathVariable UUID invoiceId,
            @RequestParam(defaultValue = "CASH") String paymentMethod) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InvoiceDto paid = billingService.collectPayment(invoiceId, paymentMethod, currentUser);
        return ResponseEntity.ok(ApiResponse.success(paid, "Payment collected successfully"));
    }

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

    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoice(@PathVariable UUID invoiceId) {
        InvoiceDto invoice = billingService.getInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }
}
