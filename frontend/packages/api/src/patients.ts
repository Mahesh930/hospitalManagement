import apiClient from "./client";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface AllergyDto {
  id?: string;
  allergen: string;
  severity: string;
  reaction: string;
}

export interface TimelinePrescriptionItemDto {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface TimelineEncounterDto {
  encounterId?: string;
  appointmentId?: string;
  encounterDate: string;
  visitType: string;
  doctorName: string;
  departmentName?: string;
  icdCode?: string;
  diagnosisNotes?: string;
  advice?: string;
  status: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weight?: number;
  prescriptionItems?: TimelinePrescriptionItemDto[];
}

export interface TimelineVitalDto {
  id?: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weightKg?: number;
  spo2?: number;
  isAbnormal?: boolean;
  recordedAt?: string;
  recordedBy?: string;
}

export interface PatientTimelineDto {
  patientId: string;
  uhid: string;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone: string;
  existingDiseases?: string;
  previousSurgeries?: string;
  allergies?: AllergyDto[];
  encounters: TimelineEncounterDto[];
  recentVitals: TimelineVitalDto[];
}

export interface PatientDto {
  id?: string;
  uhid?: string;
  abhaId?: string;
  name: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  age?: number;
  phone: string;
  altPhone?: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  aadhaar?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  existingDiseases?: string;
  previousSurgeries?: string;
  disabilityStatus?: string;
  pregnancyStatus?: boolean;
  corporatePatient?: boolean;
  tpaDetails?: string;
  qrCodeData?: string;
  isEmergency?: boolean;
  hospitalId?: string;
  hospitalName?: string;
  allergies?: AllergyDto[];
}

export const patientsApi = {
  register: (data: PatientDto) =>
    apiClient.post<ApiResponse<PatientDto>>("/patients", data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<PatientDto>>(`/patients/${id}`),

  getByUhid: (uhid: string) =>
    apiClient.get<ApiResponse<PatientDto>>(`/patients/uhid/${uhid}`),

  search: (query: string, hospitalId?: string) =>
    apiClient.get<ApiResponse<PatientDto[]>>("/patients/search", { params: { query, hospitalId: hospitalId && hospitalId !== "ALL" ? hospitalId : undefined } }),

  addAllergy: (patientId: string, allergy: AllergyDto) =>
    apiClient.post<ApiResponse<PatientDto>>(`/patients/${patientId}/allergies`, allergy),

  getTimeline: (patientId: string) =>
    apiClient.get<ApiResponse<PatientTimelineDto>>(`/patients/${patientId}/timeline`),
};
