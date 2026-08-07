package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.InvoiceDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.InvoiceRepository;
import com.mahesh.hospitalManagement.repository.OPDConsultationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final OPDConsultationRepository consultationRepository;
    private final AuditService auditService;

    private static final double DISCOUNT_THRESHOLD_MAX = 500.0;

    @Transactional
    public InvoiceDto createInvoiceFromConsultation(UUID consultationId, String idempotencyKey, String currentUser) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Invoice> existing = invoiceRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return mapToDto(existing.get());
            }
        }

        OPDConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with ID: " + consultationId));

        Double consultationFee = consultation.getDoctor().getConsultationFee() != null ?
                consultation.getDoctor().getConsultationFee() : 500.0;

        String invoiceNumber = generateInvoiceNumber();
        double gstRate = 0.18;
        double gstAmount = consultationFee * gstRate;
        double grandTotal = consultationFee + gstAmount;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .idempotencyKey(idempotencyKey)
                .patient(consultation.getPatient())
                .consultation(consultation)
                .subtotal(consultationFee)
                .discountAmount(0.0)
                .gstAmount(gstAmount)
                .grandTotal(grandTotal)
                .paymentStatus("PENDING")
                .build();

        InvoiceItem consultationItem = InvoiceItem.builder()
                .invoice(invoice)
                .description("OPD Consultation Fee - " + consultation.getDoctor().getName())
                .quantity(1)
                .unitPrice(consultationFee)
                .gstPercentage(18.0)
                .totalPrice(consultationFee + gstAmount)
                .build();

        invoice.getItems().add(consultationItem);

        Invoice saved = invoiceRepository.save(invoice);
        auditService.logAction(currentUser, "CREATE_INVOICE", null, saved.getInvoiceNumber(), null, null, null);

        return mapToDto(saved);
    }

    @Transactional
    public InvoiceDto applyDiscount(UUID invoiceId, Double discountAmount, String discountReason, String approvedBy, String currentUser) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if ("PAID".equals(invoice.getPaymentStatus())) {
            throw new BusinessValidationException("Cannot modify an invoice that is already paid.");
        }

        if (discountAmount > DISCOUNT_THRESHOLD_MAX && (approvedBy == null || approvedBy.isBlank())) {
            throw new BusinessValidationException("Discounts exceeding ₹" + DISCOUNT_THRESHOLD_MAX + " require Admin approval.");
        }

        invoice.setDiscountAmount(discountAmount);
        invoice.setDiscountReason(discountReason);
        invoice.setDiscountApprovedBy(approvedBy);

        double newSubtotal = Math.max(0, invoice.getSubtotal() - discountAmount);
        double gstRate = 0.18;
        double gstAmount = newSubtotal * gstRate;
        double grandTotal = newSubtotal + gstAmount;

        invoice.setGstAmount(gstAmount);
        invoice.setGrandTotal(grandTotal);

        Invoice saved = invoiceRepository.save(invoice);
        auditService.logAction(currentUser, "APPLY_INVOICE_DISCOUNT", "0.0", discountAmount.toString(), null, null, null);

        return mapToDto(saved);
    }

    @Transactional
    public InvoiceDto collectPayment(UUID invoiceId, String paymentMethod, String currentUser) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if ("PAID".equals(invoice.getPaymentStatus())) {
            throw new BusinessValidationException("Invoice is already paid.");
        }

        invoice.setPaymentStatus("PAID");
        invoice.setPaymentMethod(paymentMethod != null ? paymentMethod : "CASH");

        Invoice saved = invoiceRepository.save(invoice);
        auditService.logAction(currentUser, "COLLECT_PAYMENT", "PENDING", "PAID (" + invoice.getPaymentMethod() + ")", null, null, null);

        return mapToDto(saved);
    }

    @Transactional
    public InvoiceDto processRefund(UUID invoiceId, String refundReason, String approvedBy, String currentUser) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if (!"PAID".equals(invoice.getPaymentStatus())) {
            throw new BusinessValidationException("Only paid invoices can be refunded.");
        }

        if (approvedBy == null || approvedBy.isBlank()) {
            throw new BusinessValidationException("Refunds require second-person Admin approval.");
        }

        invoice.setPaymentStatus("REFUNDED");
        Invoice saved = invoiceRepository.save(invoice);

        auditService.logAction(currentUser, "PROCESS_REFUND", "PAID", "REFUNDED (" + refundReason + ")", null, null, null);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public InvoiceDto getInvoice(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));
        return mapToDto(invoice);
    }

    private String generateInvoiceNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%04d", new Random().nextInt(10000));
        return "INV-" + datePart + "-" + randomPart;
    }

    public InvoiceDto mapToDto(Invoice invoice) {
        List<InvoiceDto.InvoiceItemDto> itemDtos = invoice.getItems().stream()
                .map(item -> InvoiceDto.InvoiceItemDto.builder()
                        .id(item.getId())
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .gstPercentage(item.getGstPercentage())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return InvoiceDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .idempotencyKey(invoice.getIdempotencyKey())
                .patientId(invoice.getPatient().getId())
                .patientName(invoice.getPatient().getName())
                .patientUhid(invoice.getPatient().getUhid())
                .consultationId(invoice.getConsultation() != null ? invoice.getConsultation().getId() : null)
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .discountReason(invoice.getDiscountReason())
                .discountApprovedBy(invoice.getDiscountApprovedBy())
                .gstAmount(invoice.getGstAmount())
                .grandTotal(invoice.getGrandTotal())
                .paymentStatus(invoice.getPaymentStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .items(itemDtos)
                .build();
    }
}
