import apiClient from "./client";
import { ApiResponse } from "./patients";

export interface SuperAdminHospitalDto {
  id?: string;
  name: string;
  address?: string;
  registrationNumber: string;
  status?: string;
  isSuspended?: boolean;
  maxUsers?: number;
  maxDoctors?: number;
  maxBeds?: number;
  gstNumber?: string;
  licenseNumber?: string;
  category?: string;
  ownershipType?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  email?: string;
  phone?: string;
  emergencyNumber?: string;
  website?: string;
}

export interface FeatureFlagDto {
  id?: string;
  hospitalId: string;
  moduleCode: string;
  enabled: boolean;
}

export interface SuperAdminUserDto {
  id: string;
  username: string;
  phone?: string;
  roles?: string;
  providerType?: string;
  locked: boolean;
  hospitalName?: string;
  hospitalId?: string;
}

export interface PlatformStatsDto {
  totalHospitals: number;
  activeHospitals: number;
  suspendedHospitals: number;
  trialHospitals: number;
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateUserRequestDto {
  username: string;
  password: string;
  phone?: string;
  role?: string;
  hospitalId?: string;
}

export const superAdminApi = {
  // Hospital
  getAllHospitals: () =>
    apiClient.get<ApiResponse<SuperAdminHospitalDto[]>>("/super-admin/hospitals"),

  searchHospitals: (search: string, page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<SuperAdminHospitalDto>>>(
      `/super-admin/hospitals/search?search=${encodeURIComponent(search)}&page=${page}&size=${size}`
    ),

  onboardHospital: (data: SuperAdminHospitalDto) =>
    apiClient.post<ApiResponse<SuperAdminHospitalDto>>("/super-admin/hospitals/onboard", data),

  updateHospital: (id: string, data: SuperAdminHospitalDto) =>
    apiClient.put<ApiResponse<SuperAdminHospitalDto>>(`/super-admin/hospitals/${id}`, data),

  createHospitalUser: (id: string, userData: CreateUserRequestDto) =>
    apiClient.post<ApiResponse<SuperAdminUserDto>>(`/super-admin/hospitals/${id}/users`, userData),

  getHospitalUsers: (id: string, search = "", page = 0, size = 50) =>
    apiClient.get<ApiResponse<PageResponse<SuperAdminUserDto>>>(
      `/super-admin/hospitals/${id}/users?search=${encodeURIComponent(search)}&page=${page}&size=${size}`
    ),

  toggleHospitalStatus: (id: string, suspend: boolean) =>
    apiClient.patch<ApiResponse<SuperAdminHospitalDto>>(
      `/super-admin/hospitals/${id}/suspend?suspend=${suspend}`
    ),

  archiveHospital: (id: string) =>
    apiClient.patch<ApiResponse<SuperAdminHospitalDto>>(`/super-admin/hospitals/${id}/archive`),

  deleteHospital: (id: string) =>
    apiClient.delete<ApiResponse<SuperAdminHospitalDto>>(`/super-admin/hospitals/${id}`),

  restoreHospital: (id: string) =>
    apiClient.patch<ApiResponse<SuperAdminHospitalDto>>(`/super-admin/hospitals/${id}/restore`),

  // Platform Stats
  getPlatformStats: () =>
    apiClient.get<ApiResponse<PlatformStatsDto>>("/super-admin/stats"),

  // Feature Flags
  getHospitalFeatureFlags: (id: string) =>
    apiClient.get<ApiResponse<FeatureFlagDto[]>>(`/super-admin/hospitals/${id}/features`),

  toggleFeatureFlag: (id: string, moduleCode: string, enabled: boolean) =>
    apiClient.patch<ApiResponse<FeatureFlagDto>>(
      `/super-admin/hospitals/${id}/features/${moduleCode}?enabled=${enabled}`
    ),

  // Users
  searchUsers: (search: string, hospitalId = "", page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (hospitalId) params.append("hospitalId", hospitalId);
    params.append("page", page.toString());
    params.append("size", size.toString());
    return apiClient.get<ApiResponse<PageResponse<SuperAdminUserDto>>>(
      `/super-admin/users?${params.toString()}`
    );
  },

  lockUser: (id: string) =>
    apiClient.patch<ApiResponse<SuperAdminUserDto>>(`/super-admin/users/${id}/lock`),

  unlockUser: (id: string) =>
    apiClient.patch<ApiResponse<SuperAdminUserDto>>(`/super-admin/users/${id}/unlock`),

  resetPassword: (id: string, newPassword: string) =>
    apiClient.patch<ApiResponse<SuperAdminUserDto>>(
      `/super-admin/users/${id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`
    ),

  deleteUser: (id: string) =>
    apiClient.delete<ApiResponse<SuperAdminUserDto>>(`/super-admin/users/${id}`),

  restoreUser: (id: string) =>
    apiClient.patch<ApiResponse<SuperAdminUserDto>>(`/super-admin/users/${id}/restore`),
};
