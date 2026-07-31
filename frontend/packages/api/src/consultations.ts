import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface PrescriptionItemDto {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface PrescriptionDto {
  id?: string;
  advice?: string;
  items: PrescriptionItemDto[];
}

export interface ConsultationDto {
  id?: string;
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weight?: number;
  icdCode?: string;
  diagnosisNotes?: string;
  status?: string;
  prescription?: PrescriptionDto;
}

export const consultationsApi = {
  save: (appointmentId: string, data: ConsultationDto) =>
    apiClient.post<ApiResponse<ConsultationDto>>(`/opd/consultations/appointment/${appointmentId}`, data),

  complete: (consultationId: string) =>
    apiClient.post<ApiResponse<ConsultationDto>>(`/opd/consultations/${consultationId}/complete`),

  getByAppointment: (appointmentId: string) =>
    apiClient.get<ApiResponse<ConsultationDto>>(`/opd/consultations/appointment/${appointmentId}`),
};
