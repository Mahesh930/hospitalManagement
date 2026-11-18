import apiClient from "./client";
import type { ApiResponse } from "./patients";

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

export interface MyStationDto {
  username: string;
  roles: string[];
  stations: RoleCatalogItemDto[];
}

export const rolesApi = {
  getCatalog: () =>
    apiClient.get<ApiResponse<RoleCatalogItemDto[]>>("/roles/catalog"),
  getRole: (role: string) =>
    apiClient.get<ApiResponse<RoleCatalogItemDto>>(`/roles/${role}`),
  getMyStation: () =>
    apiClient.get<ApiResponse<MyStationDto>>("/roles/me/station"),
};

/** All MediCore system roles for staff provisioning dropdowns */
export const ALL_SYSTEM_ROLES: { value: string; label: string }[] = [
  { value: "ADMIN", label: "ADMIN (Hospital Administrator)" },
  { value: "DOCTOR", label: "DOCTOR (Physician / Consultant)" },
  { value: "NURSE", label: "NURSE (Clinical Nursing)" },
  { value: "RECEPTIONIST", label: "RECEPTIONIST (Front Desk)" },
  { value: "CASHIER", label: "CASHIER (Payment Desk)" },
  { value: "ACCOUNTANT", label: "ACCOUNTANT (Accounts)" },
  { value: "TPA_INSURANCE", label: "TPA_INSURANCE (Insurance Desk)" },
  { value: "MRD", label: "MRD (Medical Records)" },
  { value: "PHARMACIST", label: "PHARMACIST (Pharmacy)" },
  { value: "LAB_TECH", label: "LAB_TECH (Lab Technician)" },
  { value: "LAB_MANAGER", label: "LAB_MANAGER (Lab Supervisor)" },
  { value: "RADIOLOGIST", label: "RADIOLOGIST (Imaging Consultant)" },
  { value: "RADIOLOGY_TECH", label: "RADIOLOGY_TECH (Imaging Tech)" },
  { value: "BLOOD_BANK", label: "BLOOD_BANK (Blood Bank)" },
  { value: "OT_COORDINATOR", label: "OT_COORDINATOR (OT Scheduling)" },
  { value: "ANESTHETIST", label: "ANESTHETIST (Anesthesia)" },
  { value: "PHYSIOTHERAPIST", label: "PHYSIOTHERAPIST (Rehab)" },
  { value: "HR_ADMIN", label: "HR_ADMIN (Human Resources)" },
  { value: "QUALITY_OFFICER", label: "QUALITY_OFFICER (Quality / NABH)" },
];
