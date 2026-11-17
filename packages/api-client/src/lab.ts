import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface LabWorklistItemDto {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  category: string; // LAB, RADIOLOGY, CARDIOLOGY, PATHOLOGY, OTHER
  bookingDateTime?: string;
  status: string; // SCHEDULED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED, CANCELLED
  referringDoctorId?: string;
  referringDoctorName?: string;
  departmentName?: string;
  instructions?: string;
  clinicalNotes?: string;
  resultNotes?: string;
  resultAttachmentUrl?: string;
  resultRecordedAt?: string;
  isAbnormal?: boolean;
  bookedBy?: string;
  createdAt?: string;
}

export interface LabSampleCollectionDto {
  barcode: string;
  specimenType: string;
  collectionTime?: string;
  technicianNotes?: string;
}

export interface LabResultEntryDto {
  resultNotes: string;
  resultAttachmentUrl?: string;
  isAbnormal?: boolean;
  referenceRange?: string;
  technicianNotes?: string;
}

export interface LabStatsDto {
  totalTestsScheduledToday?: number;
  pendingSampleCollection?: number;
  samplesCollected?: number;
  inProgressTests?: number;
  completedToday?: number;
  abnormalResultsCount?: number;
  totalOverallTests?: number;
}

export const labApi = {
  getWorklist: (params?: { status?: string; category?: string; query?: string }) =>
    apiClient.get<ApiResponse<LabWorklistItemDto[]>>("/lab/worklist", { params }),

  getById: (bookingId: string) =>
    apiClient.get<ApiResponse<LabWorklistItemDto>>(`/lab/${bookingId}`),

  collectSample: (bookingId: string, data: LabSampleCollectionDto) =>
    apiClient.post<ApiResponse<LabWorklistItemDto>>(`/lab/${bookingId}/sample`, data),

  recordResult: (bookingId: string, data: LabResultEntryDto) =>
    apiClient.post<ApiResponse<LabWorklistItemDto>>(`/lab/${bookingId}/result`, data),

  getStats: () =>
    apiClient.get<ApiResponse<LabStatsDto>>("/lab/stats"),
};

