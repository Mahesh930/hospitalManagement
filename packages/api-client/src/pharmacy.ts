import apiClient from "./client";
import { ApiResponse } from "./patients";

export interface PrescriptionLineItemDto {
  itemId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number;
  prescribedQuantity: number;
  dispensedQuantity: number;
  instructions: string;
  batchNumber?: string;
  itemStatus: string;
  availableStock: number;
}

export interface PrescriptionQueueItemDto {
  prescriptionId: string;
  consultationId?: string;
  patientId: string;
  patientName: string;
  uhid: string;
  patientAge?: number;
  patientGender?: string;
  allergies?: string;
  doctorName: string;
  doctorSpecialization: string;
  issuedAt: string;
  status: string; // SUBMITTED, VERIFIED, PARTIALLY_DISPENSED, DISPENSED, REJECTED
  advice?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  clarificationRequested?: boolean;
  clarificationNotes?: string;
  items: PrescriptionLineItemDto[];
}

export interface MedicineBatchDto {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  batchNumber: string;
  expiryDate: string;
  mfgDate?: string;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice: number;
  quantityOnHand: number;
  quarantinedQuantity?: number;
  storageLocation?: string;
  status: string; // ACTIVE, NEAR_EXPIRY, EXPIRED, QUARANTINED, RECALLED
  supplierName?: string;
  daysUntilExpiry?: number;
}

export interface PharmacyDashboardDto {
  pendingPrescriptionsCount: number;
  verifiedPrescriptionsCount: number;
  dispensedTodayCount: number;
  todayDispensedValue: number;
  lowStockBatchesCount: number;
  nearExpiryBatchesCount: number;
  activeRecallsCount: number;
  activeQueue: PrescriptionQueueItemDto[];
  lowStockAlerts: MedicineBatchDto[];
  nearExpiryAlerts: MedicineBatchDto[];
}

export interface PrescriptionVerificationDto {
  prescriptionId: string;
  action: "VERIFY" | "REJECT" | "CLARIFY";
  notes?: string;
}

export interface DispenseItemRequestDto {
  prescriptionItemId?: string;
  medicineId: string;
  batchId: string;
  quantityDispensed: number;
  unitPrice?: number;
  dosageInstructions?: string;
}

export interface DispenseRequestDto {
  prescriptionId?: string;
  patientId: string;
  handoverTo?: string;
  instructions?: string;
  paymentStatus?: string;
  createBillingInvoice?: boolean;
  items: DispenseItemRequestDto[];
}

export interface DispensedItemDto {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantityDispensed: number;
  unitPrice: number;
  totalPrice: number;
  dosageInstructions?: string;
}

export interface DispenseResponseDto {
  id: string;
  dispenseNumber: string;
  prescriptionId?: string;
  patientId: string;
  patientName: string;
  uhid: string;
  pharmacistUsername: string;
  dispenseDate: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  handoverTo?: string;
  instructions?: string;
  invoiceId?: string;
  items: DispensedItemDto[];
}

export interface StockReceiptDto {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  mfgDate?: string;
  quantity: number;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice?: number;
  storageLocation?: string;
  supplierName?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface StockAdjustmentDto {
  batchId: string;
  quantityChange: number;
  reason: string;
  notes?: string;
}

export interface PurchaseOrderDto {
  id?: string;
  poNumber?: string;
  supplierName: string;
  supplierContact?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  status?: string;
  totalAmount?: number;
  itemsJson?: string;
  notes?: string;
}

export interface PharmacyReturnDto {
  id?: string;
  returnNumber?: string;
  patientId?: string;
  patientName?: string;
  dispenseRecordId?: string;
  medicineId: string;
  medicineName?: string;
  batchId: string;
  batchNumber?: string;
  returnQuantity: number;
  refundAmount?: number;
  disposition: string; // RETURN_TO_STOCK, QUARANTINE_WASTE, DAMAGED
  reason: string;
  status?: string;
}

export interface MedicineRecallDto {
  id?: string;
  recallNumber?: string;
  medicineId: string;
  medicineName?: string;
  batchNumber: string;
  recallReason: string;
  quarantinedQuantity?: number;
  status?: string;
}

export interface PharmacyShiftHandoverDto {
  id?: string;
  shiftName: string;
  handoverDate: string;
  outgoingPharmacist?: string;
  incomingPharmacist?: string;
  pendingPrescriptionsCount?: number;
  lowStockItemsCount?: number;
  criticalAlerts?: string;
  notes?: string;
  status?: string;
}

export interface PharmacyReportDto {
  totalDispensedCount: number;
  totalDispensedRevenue: number;
  totalItemsDispensed: number;
  expiredItemsCount: number;
  lowStockItemsCount: number;
  activeRecallsCount: number;
  dailyDispenses: Array<{ date: string; count: number; revenue: number }>;
  topMedicines: Array<{ medicineName: string; quantityDispensed: number; totalValue: number }>;
}

export interface PharmacyStockMovement {
  id: string;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  referenceNumber: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export const pharmacyApi = {
  getDashboard: () => apiClient.get<ApiResponse<PharmacyDashboardDto>>("/pharmacy/dashboard"),

  getPrescriptions: (params?: { status?: string; query?: string }) =>
    apiClient.get<ApiResponse<PrescriptionQueueItemDto[]>>("/pharmacy/prescriptions", { params }),

  verifyPrescription: (data: PrescriptionVerificationDto) =>
    apiClient.post<ApiResponse<PrescriptionQueueItemDto>>("/pharmacy/prescriptions/verify", data),

  dispense: (data: DispenseRequestDto) =>
    apiClient.post<ApiResponse<DispenseResponseDto>>("/pharmacy/dispense", data),

  getBatches: (params?: { query?: string; nearExpiryOnly?: boolean; lowStockOnly?: boolean }) =>
    apiClient.get<ApiResponse<MedicineBatchDto[]>>("/pharmacy/batches", { params }),

  addStockReceipt: (data: StockReceiptDto) =>
    apiClient.post<ApiResponse<MedicineBatchDto>>("/pharmacy/batches/receipt", data),

  adjustStock: (data: StockAdjustmentDto) =>
    apiClient.post<ApiResponse<MedicineBatchDto>>("/pharmacy/batches/adjustment", data),

  getPurchaseOrders: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<PurchaseOrderDto[]>>("/pharmacy/purchase-orders", { params }),

  createPurchaseOrder: (data: PurchaseOrderDto) =>
    apiClient.post<ApiResponse<PurchaseOrderDto>>("/pharmacy/purchase-orders", data),

  receivePurchaseOrder: (poId: string) =>
    apiClient.post<ApiResponse<PurchaseOrderDto>>(`/pharmacy/purchase-orders/${poId}/receive`),

  getReturns: () => apiClient.get<ApiResponse<PharmacyReturnDto[]>>("/pharmacy/returns"),

  processReturn: (data: PharmacyReturnDto) =>
    apiClient.post<ApiResponse<PharmacyReturnDto>>("/pharmacy/returns", data),

  getRecalls: () => apiClient.get<ApiResponse<MedicineRecallDto[]>>("/pharmacy/recalls"),

  initiateRecall: (data: MedicineRecallDto) =>
    apiClient.post<ApiResponse<MedicineRecallDto>>("/pharmacy/recalls", data),

  getShiftHandovers: () => apiClient.get<ApiResponse<PharmacyShiftHandoverDto[]>>("/pharmacy/shift-handovers"),

  recordShiftHandover: (data: PharmacyShiftHandoverDto) =>
    apiClient.post<ApiResponse<PharmacyShiftHandoverDto>>("/pharmacy/shift-handovers", data),

  getReports: () => apiClient.get<ApiResponse<PharmacyReportDto>>("/pharmacy/reports"),

  getMovements: () => apiClient.get<ApiResponse<PharmacyStockMovement[]>>("/pharmacy/movements"),
};
