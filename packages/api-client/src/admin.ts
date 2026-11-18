import apiClient from "./client";
import { ApiResponse } from "./patients";
import { CreateUserRequestDto, SuperAdminUserDto } from "./superAdmin";

export interface DoctorResponseDto {
  id: string;
  name: string;
  specialization: string;
  registrationNumber: string;
  consultationFee: number;
  email: string;
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

export interface OnboardDoctorRequest {
  userId: string;
  name: string;
  specialization: string;
  registrationNumber: string;
  consultationFee?: number;
  email?: string;
}

export const adminApi = {
  getStats: async (): Promise<HospitalAdminStatsDto> => {
    const res = await apiClient.get<ApiResponse<HospitalAdminStatsDto>>("/admin/stats");
    return res.data.data;
  },

  getDoctors: async (): Promise<DoctorResponseDto[]> => {
    const res = await apiClient.get<ApiResponse<DoctorResponseDto[]>>("/admin/doctors");
    return res.data.data;
  },

  onboardDoctor: async (data: OnboardDoctorRequest): Promise<DoctorResponseDto> => {
    const res = await apiClient.post<ApiResponse<DoctorResponseDto>>("/admin/onBoardNewDoctor", data);
    return res.data.data;
  },

  createStaffUser: async (data: CreateUserRequestDto): Promise<SuperAdminUserDto> => {
    const res = await apiClient.post<ApiResponse<SuperAdminUserDto>>("/admin/users", data);
    return res.data.data;
  },

  getStaffUsers: async (): Promise<SuperAdminUserDto[]> => {
    const res = await apiClient.get<ApiResponse<SuperAdminUserDto[]>>("/admin/users");
    return res.data.data;
  },
};
