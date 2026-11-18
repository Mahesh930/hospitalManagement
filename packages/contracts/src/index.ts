/**
 * Contract-first shared DTOs for MediCore web clients.
 * Backend (Spring) remains source of runtime truth; these types mirror /api/v1.
 * Flutter models should be generated from OpenAPI/Swagger when enabled.
 */

export type RoleType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PATIENT"
  | "RECEPTIONIST"
  | "CASHIER"
  | "ACCOUNTANT"
  | "TPA_INSURANCE"
  | "MRD"
  | "PHARMACIST"
  | "LAB_TECH"
  | "LAB_MANAGER"
  | "RADIOLOGIST"
  | "RADIOLOGY_TECH"
  | "BLOOD_BANK"
  | "OT_COORDINATOR"
  | "ANESTHETIST"
  | "PHYSIOTHERAPIST"
  | "HR_ADMIN"
  | "QUALITY_OFFICER";

/** Unified API envelope (GlobalExceptionHandler / ApiResponse). */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/** Auth login returns this DTO directly (not wrapped). */
export interface LoginResponse {
  jwt: string;
  userId: string;
  username?: string;
  roles?: RoleType[];
}

export interface PatientDto {
  id?: string;
  uhid?: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  bloodGroup?: string;
}

export interface AppointmentDto {
  id?: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointmentTime: string;
  status?: string;
  queueOrder?: number;
  tokenNumber?: string;
  reason?: string;
}

export interface InvoiceDto {
  id?: string;
  invoiceNumber?: string;
  patientId?: string;
  patientName?: string;
  grandTotal?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
}

export interface BillingStatsDto {
  todayRevenue?: number;
  pendingInvoicesCount?: number;
  pendingAmount?: number;
  paidInvoicesCount?: number;
  totalInvoicesCount?: number;
}

export interface LabWorklistItemDto {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  category: string;
  status: string;
  isAbnormal?: boolean;
}

export interface RoleCatalogItemDto {
  role: string;
  displayName: string;
  category: string;
  stationPath: string;
  description: string;
  permissions: string[];
  seeded: boolean;
  demoUsername?: string | null;
}

export interface HospitalAdminStatsDto {
  todayOpdPatients: number;
  checkedInPatients: number;
  totalDoctors: number;
  totalPatients: number;
  totalRevenueToday: number;
  pendingBillsCount: number;
  occupiedBeds: number;
  totalBeds: number;
}
