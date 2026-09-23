import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface DoctorQueueItemDto {
  appointmentId?: string;
  visitId?: string;
  patientId: string;
  tokenNumber: string;
  queueOrder: number;
  patientName: string;
  patientUhid: string;
  age?: number;
  gender?: string;
  appointmentTime?: string;
  status: string;
  priorityRank?: number;
  chiefComplaint?: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weight?: number;
  spo2?: number;
  allergyCount: number;
  allergyNames: string[];
}

export interface DoctorScheduleSlotDto {
  slotTime: string;
  patientName: string;
  patientUhid: string;
  status: string;
  appointmentId?: string;
}

export interface RecentConsultationSummaryDto {
  consultationId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  icdCode?: string;
  diagnosisNotes?: string;
  completedAt?: string;
  prescriptionItemCount: number;
}

export interface DoctorDashboardDto {
  doctorId: string;
  doctorName: string;
  specialization?: string;
  registrationNumber?: string;
  roomNumber?: string;
  consultationFee?: number;
  isAvailable: boolean;
  todayAppointmentsCount: number;
  waitingPatientsCount: number;
  inProgressCount: number;
  completedCount: number;
  activeQueue: DoctorQueueItemDto[];
  todaySchedule: DoctorScheduleSlotDto[];
  recentPatients: RecentConsultationSummaryDto[];
  criticalAlerts: string[];
}

export interface DoctorProfileDto {
  id: string;
  name: string;
  specialization?: string;
  registrationNumber?: string;
  consultationFee: number;
  email: string;
  roomNumber?: string;
  isAvailable?: boolean;
}

export const doctorsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DoctorDashboardDto>>("/doctors/dashboard"),

  getMyProfile: () =>
    apiClient.get<ApiResponse<DoctorProfileDto>>("/doctors/me"),

  callPatient: (appointmentId: string) =>
    apiClient.post<ApiResponse<string>>(`/doctors/queue/${appointmentId}/call`),

  skipPatient: (appointmentId: string) =>
    apiClient.post<ApiResponse<string>>(`/doctors/queue/${appointmentId}/skip`),

  updateAvailability: (data: { isAvailable?: boolean; roomNumber?: string }) =>
    apiClient.patch<ApiResponse<DoctorProfileDto>>("/doctors/availability", data),
};
