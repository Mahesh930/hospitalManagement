import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface AppointmentDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  doctorId: string;
  doctorName?: string;
  appointmentTime: string;
  reason?: string;
  status?: string;
  queueOrder?: number;
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
};
