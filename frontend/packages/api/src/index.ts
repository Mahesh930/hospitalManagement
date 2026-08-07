export { default as apiClient } from "./client";
export { authApi } from "./auth";
export type { LoginRequest, LoginResponse } from "./auth";
export { patientsApi } from "./patients";
export type { ApiResponse, PatientDto, AllergyDto } from "./patients";
export { appointmentsApi } from "./appointments";
export type { AppointmentDto } from "./appointments";
export { consultationsApi } from "./consultations";
export type { ConsultationDto, PrescriptionDto, PrescriptionItemDto } from "./consultations";
export { invoicesApi } from "./invoices";
export type { InvoiceDto, InvoiceItemDto } from "./invoices";
export { hospitalsApi } from "./hospitals";
export type { HospitalDto } from "./hospitals";
export { masterDataApi } from "./master-data";
export type { MedicineDto, DiagnosisDto, ChargeDto } from "./master-data";
export { superAdminApi } from "./superAdmin";
export type { SuperAdminHospitalDto, FeatureFlagDto, SuperAdminUserDto, PlatformStatsDto, PageResponse } from "./superAdmin";
export { adminApi } from "./admin";
export type { HospitalAdminStatsDto, OnboardDoctorRequest, DoctorResponseDto } from "./admin";
export { receptionistApi } from "./receptionist";
export type {
  ReceptionistDashboardDto,
  DoctorQueueStatusDto,
  VitalSignsDto,
  WalkinTokenRequestDto,
  QueueManagementDto,
  EmergencyRegistrationDto,
  DailyReceptionistReportDto,
  PatientDocumentDto
} from "./receptionist";
