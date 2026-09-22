import apiClient from "./client";
import type { ApiResponse, PatientDto } from "./patients";

export interface DoctorQueueStatusDto {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  roomNumber: string;
  isAvailable: boolean;
  waitingCount: number;
  currentToken: string;
}

export interface ReceptionistDashboardDto {
  todayAppointments: number;
  walkinPatients: number;
  waitingPatients: number;
  checkedInPatients: number;
  completedConsultations: number;
  cancelledAppointments: number;
  doctorAvailabilityCount: number;
  pendingBillingCount: number;
  todayRevenue: number;
  emergencyPatients: number;
  doctorQueues: DoctorQueueStatusDto[];
  announcements: string[];
}

export interface VitalSignsDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  appointmentId?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodSugarMgDl?: number;
  painScore?: number;
  triagePriority?: string;
  chiefComplaint?: string;
  isAbnormal?: boolean;
  abnormalNotes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface WalkinTokenRequestDto {
  patientId: string;
  doctorId: string;
  departmentId?: string;
  visitType?: string;
  isEmergency?: boolean;
  isVip?: boolean;
  notes?: string;
}

export interface QueueManagementDto {
  visitId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  tokenNumber: string;
  priorityRank: number;
  status: string;
  checkInTime: string;
  isAbnormalVitals?: boolean;
  notes?: string;
}

export interface EmergencyRegistrationDto {
  name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  doctorId?: string;
  departmentId?: string;
  notes?: string;
}

export interface DailyReceptionistReportDto {
  reportDate: string;
  newRegistrations: number;
  walkinCount: number;
  totalAppointments: number;
  checkedInCount: number;
  noShowCount: number;
  completedCount: number;
  estimatedRevenue: number;
  recentVisits: QueueManagementDto[];
}

export interface PatientDocumentDto {
  id?: string;
  patientId: string;
  docType: string;
  fileName: string;
  fileUri: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  createdAt?: string;
}

export const receptionistApi = {
  getDashboardStats: async (): Promise<ReceptionistDashboardDto> => {
    const res = await apiClient.get<ApiResponse<ReceptionistDashboardDto>>("/receptionist/dashboard");
    return res.data.data;
  },

  recordVitalSigns: async (data: VitalSignsDto): Promise<VitalSignsDto> => {
    const res = await apiClient.post<ApiResponse<VitalSignsDto>>("/receptionist/vitals", data);
    return res.data.data;
  },

  getVitalsForAppointment: async (appointmentId: string): Promise<VitalSignsDto> => {
    const res = await apiClient.get<ApiResponse<VitalSignsDto>>(`/receptionist/vitals/appointment/${appointmentId}`);
    return res.data.data;
  },

  issueWalkinToken: async (data: WalkinTokenRequestDto): Promise<QueueManagementDto> => {
    const res = await apiClient.post<ApiResponse<QueueManagementDto>>("/receptionist/walk-in", data);
    return res.data.data;
  },

  registerEmergencyPatient: async (data: EmergencyRegistrationDto): Promise<PatientDto> => {
    const res = await apiClient.post<ApiResponse<PatientDto>>("/receptionist/emergency-register", data);
    return res.data.data;
  },

  getDoctorLiveQueue: async (doctorId: string): Promise<QueueManagementDto[]> => {
    const res = await apiClient.get<ApiResponse<QueueManagementDto[]>>(`/receptionist/queue/doctor/${doctorId}`);
    return res.data.data;
  },

  updateQueueStatus: async (visitId: string, params: { status?: string; priorityRank?: number; newDoctorId?: string }): Promise<QueueManagementDto> => {
    const res = await apiClient.patch<ApiResponse<QueueManagementDto>>(`/receptionist/queue/${visitId}`, null, { params });
    return res.data.data;
  },

  getDailyReport: async (date?: string): Promise<DailyReceptionistReportDto> => {
    const res = await apiClient.get<ApiResponse<DailyReceptionistReportDto>>("/receptionist/reports/daily", { params: { date } });
    return res.data.data;
  },

  uploadPatientDocument: async (patientId: string, data: PatientDocumentDto): Promise<PatientDocumentDto> => {
    const res = await apiClient.post<ApiResponse<PatientDocumentDto>>(`/receptionist/patients/${patientId}/documents`, data);
    return res.data.data;
  },

  getPatientDocuments: async (patientId: string): Promise<PatientDocumentDto[]> => {
    const res = await apiClient.get<ApiResponse<PatientDocumentDto[]>>(`/receptionist/patients/${patientId}/documents`);
    return res.data.data;
  },
};
