import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface DoctorQueueItemDto {
  appointmentId?: string;
  visitId?: string;
  patientId: string;
  tokenNumber: string;
  queueOrder: number;
  patientName: string;
  patientUhid: string;
  age?: number;
  gender?: string;
  appointmentTime?: string;
  status: string;
  priorityRank?: number;
  chiefComplaint?: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weight?: number;
  spo2?: number;
  allergyCount: number;
  allergyNames: string[];
}

export interface DoctorScheduleSlotDto {
  slotTime: string;
  patientName: string;
  patientUhid: string;
  status: string;
  appointmentId?: string;
}

export interface RecentConsultationSummaryDto {
  consultationId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  icdCode?: string;
  diagnosisNotes?: string;
  completedAt?: string;
  prescriptionItemCount: number;
}

export interface DoctorDashboardDto {
  doctorId: string;
  doctorName: string;
  specialization?: string;
  registrationNumber?: string;
  roomNumber?: string;
  consultationFee?: number;
  isAvailable: boolean;
  todayAppointmentsCount: number;
  waitingPatientsCount: number;
  inProgressCount: number;
  completedCount: number;
  activeQueue: DoctorQueueItemDto[];
  todaySchedule: DoctorScheduleSlotDto[];
  recentPatients: RecentConsultationSummaryDto[];
  criticalAlerts: string[];
}

export interface DoctorProfileDto {
  id: string;
  name: string;
  specialization?: string;
  registrationNumber?: string;
  consultationFee: number;
  email: string;
  roomNumber?: string;
  isAvailable?: boolean;
  phone?: string;
  qualification?: string;
  experienceYears?: number;
  scheduleSummary?: string;
}

export interface PatientClinicalSummaryDto {
  patientId: string;
  uhid: string;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  contactNumber?: string;
  allergies: Array<{ allergen: string; severity?: string; reaction?: string }>;
  latestVitals?: {
    bloodPressure?: string;
    pulseRate?: number;
    temperature?: number;
    spo2?: number;
    respiratoryRate?: number;
    weightKg?: number;
    recordedAt?: string;
    isAbnormal?: boolean;
  };
  vitalHistory: Array<{
    bloodPressure?: string;
    pulseRate?: number;
    temperature?: number;
    spo2?: number;
    respiratoryRate?: number;
    weightKg?: number;
    recordedAt?: string;
    isAbnormal?: boolean;
  }>;
  pastConsultations: Array<{
    consultationId: string;
    consultationDate: string;
    doctorName: string;
    icdCode?: string;
    diagnosisNotes?: string;
    status: string;
  }>;
  activePrescriptions: Array<{
    prescriptionId: string;
    prescribedDate: string;
    doctorName: string;
    medications: string[];
  }>;
  recentInvestigations: Array<{
    bookingId: string;
    testName: string;
    category: string;
    bookingDate: string;
    status: string;
    isAbnormal?: boolean;
    resultNotes?: string;
  }>;
  activeBedNumber?: string;
  activeWardName?: string;
}

export interface ClinicalTimelineEventDto {
  timestamp: string;
  eventType: string;
  title: string;
  summary: string;
  performerName: string;
  severity: string;
}

export interface DoctorInvestigationOrderDto {
  patientId: string;
  testName: string;
  category: string; // LAB, RADIOLOGY, etc.
  clinicalNotes?: string;
  instructions?: string;
  departmentName?: string;
  bookingDateTime?: string;
}

export interface DoctorInvestigationResultDto {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  category: string;
  bookingDateTime: string;
  status: string;
  referringDoctorId?: string;
  referringDoctorName?: string;
  departmentName?: string;
  instructions?: string;
  clinicalNotes?: string;
  resultNotes?: string;
  resultAttachmentUrl?: string;
  resultRecordedAt?: string;
  isAbnormal?: boolean;
}

export interface InpatientProgressNoteDto {
  id?: string;
  bedAdmissionId: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  bedNumber?: string;
  wardName?: string;
  doctorId?: string;
  doctorName?: string;
  noteType?: string; // WARD_ROUND, SOAP_NOTE
  roundDateTime?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  isCritical?: boolean;
  clinicalInstructions?: string;
}

export interface MedicalCertificateDto {
  id?: string;
  certificateNumber?: string;
  certificateType: string; // FITNESS, MEDICAL_LEAVE, SICKNESS, etc.
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  issueDate?: string;
  startDate?: string;
  endDate?: string;
  diagnosis?: string;
  clinicalRemarks?: string;
  recommendations?: string;
  status?: string;
}

export interface DoctorNurseInstructionDto {
  id?: string;
  patientId: string;
  bedAdmissionId?: string;
  wardId?: string;
  taskTitle: string;
  description?: string;
  priority?: string;
  scheduledAt?: string;
  dueAt?: string;
}

export interface AdmissionRecommendationDto {
  patientId: string;
  reasonForAdmission: string;
  suggestedDepartment?: string;
  suggestedWardType?: string;
  priority?: string;
  clinicalNotes?: string;
}

export interface DischargeRecommendationDto {
  bedAdmissionId: string;
  dischargeRecommendation: string;
  dischargeInstructions?: string;
  conditionAtDischarge?: string;
  dietInstructions?: string;
  activityInstructions?: string;
}

export interface CatalogueItemDto {
  id: string;
  icdCode?: string;
  name?: string;
  genericName?: string;
  description?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
}

export const doctorsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DoctorDashboardDto>>("/doctors/dashboard"),

  getMyProfile: () =>
    apiClient.get<ApiResponse<DoctorProfileDto>>("/doctors/me"),

  updateProfile: (data: Partial<DoctorProfileDto>) =>
    apiClient.put<ApiResponse<DoctorProfileDto>>("/doctors/profile", data),

  callPatient: (appointmentId: string) =>
    apiClient.post<ApiResponse<string>>(`/doctors/queue/${appointmentId}/call`),

  skipPatient: (appointmentId: string) =>
    apiClient.post<ApiResponse<string>>(`/doctors/queue/${appointmentId}/skip`),

  updateAvailability: (data: { isAvailable?: boolean; roomNumber?: string }) =>
    apiClient.patch<ApiResponse<DoctorProfileDto>>("/doctors/availability", data),

  getPatientSummary: (patientId: string) =>
    apiClient.get<ApiResponse<PatientClinicalSummaryDto>>(`/doctors/patients/${patientId}/summary`),

  getPatientTimeline: (patientId: string) =>
    apiClient.get<ApiResponse<ClinicalTimelineEventDto[]>>(`/doctors/patients/${patientId}/timeline`),

  orderInvestigation: (data: DoctorInvestigationOrderDto) =>
    apiClient.post<ApiResponse<DoctorInvestigationResultDto>>("/doctors/investigations", data),

  getInvestigations: (params?: { category?: string; abnormalOnly?: boolean }) =>
    apiClient.get<ApiResponse<DoctorInvestigationResultDto[]>>("/doctors/investigations", { params }),

  reviewInvestigation: (bookingId: string, reviewNotes: string) =>
    apiClient.post<ApiResponse<DoctorInvestigationResultDto>>(`/doctors/investigations/${bookingId}/review`, { reviewNotes }),

  createProgressNote: (data: InpatientProgressNoteDto) =>
    apiClient.post<ApiResponse<InpatientProgressNoteDto>>("/doctors/ipd/progress-notes", data),

  getProgressNotes: (admissionId: string) =>
    apiClient.get<ApiResponse<InpatientProgressNoteDto[]>>(`/doctors/ipd/admissions/${admissionId}/progress-notes`),

  issueCertificate: (data: MedicalCertificateDto) =>
    apiClient.post<ApiResponse<MedicalCertificateDto>>("/doctors/certificates", data),

  getPatientCertificates: (patientId: string) =>
    apiClient.get<ApiResponse<MedicalCertificateDto[]>>(`/doctors/patients/${patientId}/certificates`),

  assignNurseInstruction: (data: DoctorNurseInstructionDto) =>
    apiClient.post<ApiResponse<DoctorNurseInstructionDto>>("/doctors/nurse-instructions", data),

  recommendAdmission: (data: AdmissionRecommendationDto) =>
    apiClient.post<ApiResponse<string>>("/doctors/recommendations/admission", data),

  recommendDischarge: (data: DischargeRecommendationDto) =>
    apiClient.post<ApiResponse<string>>("/doctors/recommendations/discharge", data),

  getActiveInpatients: () =>
    apiClient.get<ApiResponse<any[]>>("/doctors/ipd/inpatients"),

  searchDiagnoses: (query?: string) =>
    apiClient.get<ApiResponse<CatalogueItemDto[]>>("/doctors/catalogues/diagnoses", { params: { query } }),

  searchMedicines: (query?: string) =>
    apiClient.get<ApiResponse<CatalogueItemDto[]>>("/doctors/catalogues/medicines", { params: { query } }),
};
