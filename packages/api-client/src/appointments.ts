import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface AppointmentDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  doctorId: string;
  doctorName?: string;
  departmentName?: string;
  appointmentTime: string;
  reason?: string;
  status?: string;
  queueOrder?: number;
  tokenNumber?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  reminderSentAt?: string;
  referralSource?: string;
}

export const appointmentsApi = {
  book: (data: AppointmentDto) =>
    apiClient.post<ApiResponse<AppointmentDto>>("/appointments", data),

  checkIn: (id: string) =>
    apiClient.post<ApiResponse<AppointmentDto>>(`/appointments/${id}/check-in`),

  getDoctorQueue: (doctorId: string) =>
    apiClient.get<ApiResponse<AppointmentDto[]>>(`/appointments/doctor/${doctorId}/queue`),

  getPatientHistory: (patientId: string) =>
    apiClient.get<ApiResponse<AppointmentDto[]>>(`/appointments/patient/${patientId}/history`),

  search: (params?: { date?: string; doctorId?: string; status?: string; patientId?: string }) =>
    apiClient.get<ApiResponse<AppointmentDto[]>>("/appointments", { params }),

  reschedule: (id: string, params: { newTime?: string; newDoctorId?: string }) =>
    apiClient.patch<ApiResponse<AppointmentDto>>(`/appointments/${id}/reschedule`, null, { params }),

  cancel: (id: string, reason?: string) =>
    apiClient.patch<ApiResponse<AppointmentDto>>(`/appointments/${id}/cancel`, null, { params: { reason } }),

  confirm: (id: string) =>
    apiClient.patch<ApiResponse<AppointmentDto>>(`/appointments/${id}/confirm`),

  markNoShow: (id: string) =>
    apiClient.patch<ApiResponse<AppointmentDto>>(`/appointments/${id}/no-show`),

  sendReminder: (id: string) =>
    apiClient.post<ApiResponse<AppointmentDto>>(`/appointments/${id}/remind`),
};
