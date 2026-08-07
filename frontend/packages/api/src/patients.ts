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
  allergies?: AllergyDto[];
}

export const patientsApi = {
  register: (data: PatientDto) =>
    apiClient.post<ApiResponse<PatientDto>>("/patients", data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<PatientDto>>(`/patients/${id}`),

  getByUhid: (uhid: string) =>
    apiClient.get<ApiResponse<PatientDto>>(`/patients/uhid/${uhid}`),

  search: (query: string) =>
    apiClient.get<ApiResponse<PatientDto[]>>("/patients/search", { params: { query } }),

  addAllergy: (patientId: string, allergy: AllergyDto) =>
    apiClient.post<ApiResponse<PatientDto>>(`/patients/${patientId}/allergies`, allergy),
};
