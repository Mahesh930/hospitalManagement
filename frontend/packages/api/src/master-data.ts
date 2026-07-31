import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface MedicineDto {
  id?: string;
  name: string;
  genericName: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  unitPrice?: number;
}

export interface DiagnosisDto {
  id?: string;
  icdCode: string;
  description: string;
  category?: string;
}

export interface ChargeDto {
  id?: string;
  itemCode: string;
  itemName: string;
  category: string;
  standardPrice: number;
  gstPercentage: number;
}

export const masterDataApi = {
  addMedicine: (data: MedicineDto) =>
    apiClient.post<ApiResponse<MedicineDto>>("/master-data/medicines", data),

  searchMedicines: (query?: string) =>
    apiClient.get<ApiResponse<MedicineDto[]>>("/master-data/medicines", { params: { query } }),

  addDiagnosis: (data: DiagnosisDto) =>
    apiClient.post<ApiResponse<DiagnosisDto>>("/master-data/diagnoses", data),

  searchDiagnoses: (query?: string) =>
    apiClient.get<ApiResponse<DiagnosisDto[]>>("/master-data/diagnoses", { params: { query } }),

  addCharge: (data: ChargeDto) =>
    apiClient.post<ApiResponse<ChargeDto>>("/master-data/charges", data),

  getAllCharges: () =>
    apiClient.get<ApiResponse<ChargeDto[]>>("/master-data/charges"),
};
