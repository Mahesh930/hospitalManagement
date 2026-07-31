import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface InvoiceItemDto {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  totalPrice: number;
}

export interface InvoiceDto {
  id?: string;
  invoiceNumber?: string;
  idempotencyKey?: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  consultationId?: string;
  subtotal?: number;
  discountAmount?: number;
  discountReason?: string;
  discountApprovedBy?: string;
  gstAmount?: number;
  grandTotal?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: InvoiceItemDto[];
}

export const invoicesApi = {
  createFromConsultation: (consultationId: string, idempotencyKey?: string) =>
    apiClient.post<ApiResponse<InvoiceDto>>(
      `/invoices/consultation/${consultationId}`,
      null,
      { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {} }
    ),

  applyDiscount: (invoiceId: string, discountAmount: number, discountReason?: string, approvedBy?: string) =>
    apiClient.post<ApiResponse<InvoiceDto>>(
      `/invoices/${invoiceId}/discount`,
      null,
      { params: { discountAmount, discountReason, approvedBy } }
    ),

  collectPayment: (invoiceId: string, paymentMethod: string) =>
    apiClient.post<ApiResponse<InvoiceDto>>(
      `/invoices/${invoiceId}/pay`,
      null,
      { params: { paymentMethod } }
    ),

  refund: (invoiceId: string, refundReason: string, approvedBy: string) =>
    apiClient.post<ApiResponse<InvoiceDto>>(
      `/invoices/${invoiceId}/refund`,
      null,
      { params: { refundReason, approvedBy } }
    ),

  getById: (invoiceId: string) =>
    apiClient.get<ApiResponse<InvoiceDto>>(`/invoices/${invoiceId}`),
};
