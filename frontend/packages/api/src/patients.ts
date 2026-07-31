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
  birthDate?: string;
  age?: number;
  phone: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
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
