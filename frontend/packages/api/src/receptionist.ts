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
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface DuplicateCheckDto {
  duplicate: boolean;
  matchCount: number;
  matchedPatients: {
    id: string;
    uhid: string;
    name: string;
    phone: string;
    email?: string;
    aadhaar?: string;
    gender?: string;
    age?: number;
    matchReason: string;
  }[];
}

export interface PatientMergeRequestDto {
  id?: string;
  sourcePatientId: string;
  sourcePatientUhid?: string;
  sourcePatientName?: string;
  targetPatientId: string;
  targetPatientUhid?: string;
  targetPatientName?: string;
  reason: string;
  status?: string;
  requestedBy?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt?: string;
}

export interface DoctorScheduleDto {
  doctorId: string;
  doctorName: string;
  specialization: string;
  departmentName: string;
  roomNumber: string;
  workingHours: string;
  available: boolean;
  onLeave: boolean;
  leaveReason?: string;
  activeQueueCount: number;
  todayAppointmentsCount: number;
  consultationFee: number;
}

export interface InsuranceDetailsDto {
  id?: string;
  patientId: string;
  policyNumber: string;
  provider: string;
  policyName?: string;
  validTill?: string;
  tpaName?: string;
  preAuthStatus?: string;
  coverageAmount?: number;
  remarks?: string;
}

export interface DiagnosticBookingDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  testName: string;
  category: string; // LAB, RADIOLOGY, CARDIOLOGY, PATHOLOGY, OTHER
  bookingDateTime?: string;
  status?: string;
  referringDoctorId?: string;
  referringDoctorName?: string;
  departmentName?: string;
  instructions?: string;
  bookedBy?: string;
  createdAt?: string;
}

export interface ReceptionShiftHandoverDto {
  id?: string;
  shiftDate?: string;
  shiftType: string; // MORNING, EVENING, NIGHT
  outgoingStaff?: string;
  incomingStaff?: string;
  cashCollected?: number;
  totalTokensIssued?: number;
  totalWalkinsHandled?: number;
  totalEmergenciesHandled?: number;
  pendingAppointmentsSummary?: string;
  handoverNotes: string;
  createdAt?: string;
}

export interface PatientFeedbackDto {
  id?: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  contactPhone?: string;
  category: string; // COMPLAINT, SERVICE_REQUEST, SUGGESTION, COMPLIMENT
  subject: string;
  description: string;
  severity: string; // LOW, MEDIUM, HIGH, CRITICAL
  status?: string; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  recordedBy?: string;
  assignedDepartment?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt?: string;
}

export interface LostAndFoundItemDto {
  id?: string;
  itemName: string;
  category?: string; // VALUABLES, DOCUMENTS, ELECTRONICS, CLOTHING, OTHER
  description?: string;
  foundLocation: string;
  foundDateTime?: string;
  foundBy?: string;
  storageLocation?: string;
  status?: string; // UNCLAIMED, CLAIMED, DISPOSED
  claimedBy?: string;
  claimantContact?: string;
  claimantIdProof?: string;
  claimedDateTime?: string;
  remarks?: string;
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

  verifyPatientDocument: async (documentId: string): Promise<PatientDocumentDto> => {
    const res = await apiClient.patch<ApiResponse<PatientDocumentDto>>(`/receptionist/documents/${documentId}/verify`);
    return res.data.data;
  },

  checkDuplicate: async (params: { phone?: string; name?: string; email?: string; aadhaar?: string }): Promise<DuplicateCheckDto> => {
    const res = await apiClient.get<ApiResponse<DuplicateCheckDto>>("/receptionist/duplicate-check", { params });
    return res.data.data;
  },

  createMergeRequest: async (data: PatientMergeRequestDto): Promise<PatientMergeRequestDto> => {
    const res = await apiClient.post<ApiResponse<PatientMergeRequestDto>>("/receptionist/merge-requests", data);
    return res.data.data;
  },

  getMergeRequests: async (status?: string): Promise<PatientMergeRequestDto[]> => {
    const res = await apiClient.get<ApiResponse<PatientMergeRequestDto[]>>("/receptionist/merge-requests", { params: { status } });
    return res.data.data;
  },

  getDoctorSchedules: async (): Promise<DoctorScheduleDto[]> => {
    const res = await apiClient.get<ApiResponse<DoctorScheduleDto[]>>("/receptionist/doctors/schedules");
    return res.data.data;
  },

  assignInsurance: async (patientId: string, data: InsuranceDetailsDto): Promise<InsuranceDetailsDto> => {
    const res = await apiClient.post<ApiResponse<InsuranceDetailsDto>>(`/receptionist/patients/${patientId}/insurance`, data);
    return res.data.data;
  },

  getInsurance: async (patientId: string): Promise<InsuranceDetailsDto> => {
    const res = await apiClient.get<ApiResponse<InsuranceDetailsDto>>(`/receptionist/patients/${patientId}/insurance`);
    return res.data.data;
  },

  scheduleDiagnostic: async (data: DiagnosticBookingDto): Promise<DiagnosticBookingDto> => {
    const res = await apiClient.post<ApiResponse<DiagnosticBookingDto>>("/receptionist/diagnostics", data);
    return res.data.data;
  },

  getDiagnostics: async (params?: { patientId?: string; status?: string }): Promise<DiagnosticBookingDto[]> => {
    const res = await apiClient.get<ApiResponse<DiagnosticBookingDto[]>>("/receptionist/diagnostics", { params });
    return res.data.data;
  },

  createShiftHandover: async (data: ReceptionShiftHandoverDto): Promise<ReceptionShiftHandoverDto> => {
    const res = await apiClient.post<ApiResponse<ReceptionShiftHandoverDto>>("/receptionist/handovers", data);
    return res.data.data;
  },

  getShiftHandovers: async (date?: string): Promise<ReceptionShiftHandoverDto[]> => {
    const res = await apiClient.get<ApiResponse<ReceptionShiftHandoverDto[]>>("/receptionist/handovers", { params: { date } });
    return res.data.data;
  },

  registerFeedback: async (data: PatientFeedbackDto): Promise<PatientFeedbackDto> => {
    const res = await apiClient.post<ApiResponse<PatientFeedbackDto>>("/receptionist/feedbacks", data);
    return res.data.data;
  },

  getFeedbacks: async (params?: { patientId?: string; status?: string }): Promise<PatientFeedbackDto[]> => {
    const res = await apiClient.get<ApiResponse<PatientFeedbackDto[]>>("/receptionist/feedbacks", { params });
    return res.data.data;
  },

  resolveFeedback: async (feedbackId: string, resolutionNotes: string): Promise<PatientFeedbackDto> => {
    const res = await apiClient.patch<ApiResponse<PatientFeedbackDto>>(`/receptionist/feedbacks/${feedbackId}/resolve`, null, {
      params: { resolutionNotes },
    });
    return res.data.data;
  },

  recordLostAndFound: async (data: LostAndFoundItemDto): Promise<LostAndFoundItemDto> => {
    const res = await apiClient.post<ApiResponse<LostAndFoundItemDto>>("/receptionist/lost-and-found", data);
    return res.data.data;
  },

  getLostAndFoundItems: async (status?: string): Promise<LostAndFoundItemDto[]> => {
    const res = await apiClient.get<ApiResponse<LostAndFoundItemDto[]>>("/receptionist/lost-and-found", { params: { status } });
    return res.data.data;
  },

  claimLostAndFound: async (itemId: string, params: { claimedBy: string; claimantContact?: string; claimantIdProof?: string; remarks?: string }): Promise<LostAndFoundItemDto> => {
    const res = await apiClient.patch<ApiResponse<LostAndFoundItemDto>>(`/receptionist/lost-and-found/${itemId}/claim`, null, { params });
    return res.data.data;
  },

  getPatientInvoices: async (patientId: string): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/invoices/patient/${patientId}`);
    return res.data.data;
  },
};
