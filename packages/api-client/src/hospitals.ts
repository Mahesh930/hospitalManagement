import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface HospitalDto {
  id?: string;
  name: string;
  address: string;
  registrationNumber: string;
  status?: string;
}

export const hospitalsApi = {
  provision: (data: HospitalDto) =>
    apiClient.post<ApiResponse<HospitalDto>>("/hospitals", data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<HospitalDto>>(`/hospitals/${id}`),

  getAll: () =>
    apiClient.get<ApiResponse<HospitalDto[]>>("/hospitals"),
};
