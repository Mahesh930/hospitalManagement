import apiClient from "./client";
import type { ApiResponse } from "./patients";
import type { VitalSignsDto, QueueManagementDto } from "./receptionist";

export interface NurseDashboardDto {
  todayTriageCount: number;
  pendingTriageCount: number;
  abnormalVitalsCount: number;
  occupiedBedsCount: number;
  totalBedsCount: number;
  activeAdmissionsCount: number;
  pendingMedicationsCount: number;
  recentAbnormalAlerts: VitalSignsDto[];
  activeQueue: QueueManagementDto[];
}

export interface WardDto {
  id?: string;
  hospitalId?: string;
  name: string;
  wardType: string;
  totalBeds: number;
  floorNumber?: string;
  description?: string;
  occupiedBeds?: number;
  availableBeds?: number;
}

export interface BedDto {
  id?: string;
  wardId: string;
  wardName?: string;
  hospitalId?: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "CLEANING";
  dailyRate?: number;
  currentPatientId?: string;
  currentPatientName?: string;
  currentPatientUhid?: string;
  currentAdmissionId?: string;
  admittedDoctorName?: string;
}

export interface BedAdmissionRequestDto {
  patientId: string;
  bedId: string;
  admittingDoctorId?: string;
  reasonForAdmission?: string;
}

export interface BedAdmissionDto {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  bedId: string;
  bedNumber: string;
  wardName: string;
  admittingDoctorId?: string;
  doctorName?: string;
  admissionTime: string;
  dischargeTime?: string;
  reasonForAdmission?: string;
  status: "ADMITTED" | "DISCHARGED" | "TRANSFERRED";
  admittedByNurse?: string;
  dischargeNotes?: string;
}

export interface MedicationAdministrationRequestDto {
  prescriptionItemId: string;
  patientId: string;
  bedAdmissionId?: string;
  dosage?: string;
  route?: string;
  status: "GIVEN" | "HELD" | "REFUSED";
  notes?: string;
}

export interface MedicationAdministrationDto {
  id?: string;
  patientId: string;
  patientName?: string;
  prescriptionItemId: string;
  medicineName?: string;
  dosage?: string;
  route?: string;
  status: "GIVEN" | "HELD" | "REFUSED" | "PENDING";
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
}

export interface NursingNoteDto {
  id?: string;
  patientId: string;
  patientName?: string;
  bedAdmissionId?: string;
  patientVisitId?: string;
  noteType: "ASSESSMENT" | "PROGRESS" | "PROCEDURE" | "HANDOVER";
  content: string;
  nurseName?: string;
  recordedAt?: string;
}

export const nurseApi = {
  getDashboardStats: async (): Promise<ApiResponse<NurseDashboardDto>> => {
    const res = await apiClient.get<ApiResponse<NurseDashboardDto>>("/api/v1/nurses/dashboard");
    return res.data;
  },

  getTriageQueue: async (): Promise<ApiResponse<QueueManagementDto[]>> => {
    const res = await apiClient.get<ApiResponse<QueueManagementDto[]>>("/api/v1/nurses/triage-queue");
    return res.data;
  },

  recordTriageVitals: async (dto: VitalSignsDto): Promise<ApiResponse<VitalSignsDto>> => {
    const res = await apiClient.post<ApiResponse<VitalSignsDto>>("/api/v1/nurses/vitals", dto);
    return res.data;
  },

  getWards: async (hospitalId?: string): Promise<ApiResponse<WardDto[]>> => {
    const res = await apiClient.get<ApiResponse<WardDto[]>>("/api/v1/nurses/wards", {
      params: hospitalId ? { hospitalId } : undefined,
    });
    return res.data;
  },

  createWard: async (dto: WardDto): Promise<ApiResponse<WardDto>> => {
    const res = await apiClient.post<ApiResponse<WardDto>>("/api/v1/nurses/wards", dto);
    return res.data;
  },

  getBeds: async (wardId?: string, hospitalId?: string): Promise<ApiResponse<BedDto[]>> => {
    const res = await apiClient.get<ApiResponse<BedDto[]>>("/api/v1/nurses/beds", {
      params: { wardId, hospitalId },
    });
    return res.data;
  },

  createBed: async (dto: BedDto): Promise<ApiResponse<BedDto>> => {
    const res = await apiClient.post<ApiResponse<BedDto>>("/api/v1/nurses/beds", dto);
    return res.data;
  },

  admitPatient: async (dto: BedAdmissionRequestDto): Promise<ApiResponse<BedAdmissionDto>> => {
    const res = await apiClient.post<ApiResponse<BedAdmissionDto>>("/api/v1/nurses/admissions", dto);
    return res.data;
  },

  transferBed: async (admissionId: string, targetBedId: string): Promise<ApiResponse<BedAdmissionDto>> => {
    const res = await apiClient.patch<ApiResponse<BedAdmissionDto>>(
      `/api/v1/nurses/admissions/${admissionId}/transfer`,
      null,
      { params: { targetBedId } }
    );
    return res.data;
  },

  dischargePatient: async (admissionId: string, dischargeNotes?: string): Promise<ApiResponse<BedAdmissionDto>> => {
    const res = await apiClient.patch<ApiResponse<BedAdmissionDto>>(
      `/api/v1/nurses/admissions/${admissionId}/discharge`,
      null,
      { params: dischargeNotes ? { dischargeNotes } : undefined }
    );
    return res.data;
  },

  getActiveAdmissions: async (hospitalId?: string): Promise<ApiResponse<BedAdmissionDto[]>> => {
    const res = await apiClient.get<ApiResponse<BedAdmissionDto[]>>("/api/v1/nurses/admissions", {
      params: hospitalId ? { hospitalId } : undefined,
    });
    return res.data;
  },

  getPatientPrescriptionsDue: async (patientId: string): Promise<ApiResponse<MedicationAdministrationDto[]>> => {
    const res = await apiClient.get<ApiResponse<MedicationAdministrationDto[]>>(`/api/v1/nurses/emar/patient/${patientId}`);
    return res.data;
  },

  recordMedicationAdministration: async (dto: MedicationAdministrationRequestDto): Promise<ApiResponse<MedicationAdministrationDto>> => {
    const res = await apiClient.post<ApiResponse<MedicationAdministrationDto>>("/api/v1/nurses/emar/administer", dto);
    return res.data;
  },

  getPatientMedicationHistory: async (patientId: string): Promise<ApiResponse<MedicationAdministrationDto[]>> => {
    const res = await apiClient.get<ApiResponse<MedicationAdministrationDto[]>>(`/api/v1/nurses/emar/history/${patientId}`);
    return res.data;
  },

  addNursingNote: async (dto: NursingNoteDto): Promise<ApiResponse<NursingNoteDto>> => {
    const res = await apiClient.post<ApiResponse<NursingNoteDto>>("/api/v1/nurses/notes", dto);
    return res.data;
  },

  getPatientNursingNotes: async (patientId: string): Promise<ApiResponse<NursingNoteDto[]>> => {
    const res = await apiClient.get<ApiResponse<NursingNoteDto[]>>(`/api/v1/nurses/notes/patient/${patientId}`);
    return res.data;
  },
};
