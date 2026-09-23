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

export interface FluidBalanceDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  recordType: "INTAKE" | "OUTPUT";
  subCategory: string; // ORAL, IV_FLUID, TUBE_FEED, BLOOD_PRODUCT, URINE, SURGICAL_DRAIN, VOMIT, NG_ASPIRATE, OTHER
  amountMl: number;
  recordedAt?: string;
  recordedBy?: string;
  notes?: string;
}

export interface FluidBalanceSummaryDto {
  patientId: string;
  patientName: string;
  patientUhid: string;
  totalIntakeMl: number;
  totalOutputMl: number;
  netBalanceMl: number;
  isFluidOverloadRisk: boolean;
  recentRecords: FluidBalanceDto[];
}

export interface NursingCareRecordDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  careType: string; // WOUND_DRESSING, CATHETER_CARE, IV_LINE_MONITORING, DRAIN_CARE, REPOSITIONING, HYGIENE_CARE, OXYGEN_THERAPY, NEBULIZATION, BLOOD_TRANSFUSION
  siteOrDevice?: string;
  statusOrCondition?: string;
  details?: string;
  performedBy?: string;
  performedAt?: string;
}

export interface NursingTaskDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  wardId?: string;
  wardName?: string;
  taskTitle: string;
  description?: string;
  taskType: string; // MEDICATION, VITALS_CHECK, DRESSING, LAB_COLLECTION, DOCTOR_ORDER, GENERAL_CARE, ASSESSMENT
  priority: "ROUTINE" | "URGENT" | "STAT";
  scheduledAt?: string;
  dueAt?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedNurse?: string;
  completedBy?: string;
  completedAt?: string;
  completionNotes?: string;
}

export interface ClinicalEscalationDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  wardId?: string;
  wardName?: string;
  severity: "ROUTINE" | "URGENT" | "CRITICAL";
  triggerReason: string; // ABNORMAL_VITALS, PATIENT_DETERIORATION, ADVERSE_REACTION, EMERGENCY_CODE
  clinicalNotes: string;
  escalatedBy?: string;
  escalatedAt?: string;
  attendingDoctorName?: string;
  isAcknowledged?: boolean;
  acknowledgedByDoctor?: string;
  acknowledgedAt?: string;
  doctorResponseNotes?: string;
}

export interface NursingAssessmentDto {
  id?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  assessmentType: string; // FALL_RISK_MORSE, PRESSURE_ULCER_BRADEN, MOBILITY_ASSESSMENT, PRE_OP_CHECKLIST, DISCHARGE_CHECKLIST, INFECTION_CONTROL
  totalScore?: number;
  riskLevel?: string; // LOW, MODERATE, HIGH, CRITICAL, VERY_HIGH, MILD, NO_RISK
  findingsJson?: string;
  clinicalSummary?: string;
  assessedBy?: string;
  assessedAt?: string;
}

export interface NursingIncidentDto {
  id?: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  bedAdmissionId?: string;
  wardId?: string;
  wardName?: string;
  incidentType: string; // PATIENT_FALL, MEDICATION_ERROR, EQUIPMENT_FAILURE, ADVERSE_DRUG_REACTION, INJURY, OTHER
  severity: "NEAR_MISS" | "MINOR" | "MODERATE" | "SEVERE";
  incidentTime?: string;
  description: string;
  immediateActionTaken?: string;
  reportedBy?: string;
  reportedAt?: string;
  investigationStatus?: string;
  resolutionNotes?: string;
}

export interface ShiftHandoverReportDto {
  id?: string;
  wardId?: string;
  wardName?: string;
  shiftType: "MORNING" | "EVENING" | "NIGHT";
  shiftDate?: string;
  outgoingNurse?: string;
  incomingNurse?: string;
  totalInpatients?: number;
  criticalPatientsCount?: number;
  handoverSummary: string;
  pendingTasksSummary?: string;
  handoverTime?: string;
}

export interface InpatientSummaryDto {
  patientId: string;
  name: string;
  uhid: string;
  gender?: string;
  bloodGroup?: string;
  age?: number;
  bedAdmissionId?: string;
  currentWardName?: string;
  currentBedNumber?: string;
  admissionStatus?: string;
  admittingDoctorName?: string;
  reasonForAdmission?: string;
  allergies?: string[];
  latestVitals?: VitalSignsDto;
  fluidBalanceSummary?: FluidBalanceSummaryDto;
  pendingMedications?: MedicationAdministrationDto[];
  activeTasks?: NursingTaskDto[];
  latestRiskAssessments?: NursingAssessmentDto[];
  activeEscalations?: ClinicalEscalationDto[];
  recentNotes?: NursingNoteDto[];
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

  getAssignedWard: async (): Promise<ApiResponse<WardDto>> => {
    const res = await apiClient.get<ApiResponse<WardDto>>("/api/v1/nurses/assigned-ward");
    return res.data;
  },

  setAssignedWard: async (wardId: string): Promise<ApiResponse<WardDto>> => {
    const res = await apiClient.patch<ApiResponse<WardDto>>("/api/v1/nurses/assigned-ward", null, {
      params: { wardId },
    });
    return res.data;
  },

  recordFluidBalance: async (dto: FluidBalanceDto): Promise<ApiResponse<FluidBalanceDto>> => {
    const res = await apiClient.post<ApiResponse<FluidBalanceDto>>("/api/v1/nurses/fluid-balance", dto);
    return res.data;
  },

  getFluidBalanceSummary: async (patientId: string): Promise<ApiResponse<FluidBalanceSummaryDto>> => {
    const res = await apiClient.get<ApiResponse<FluidBalanceSummaryDto>>(`/api/v1/nurses/fluid-balance/patient/${patientId}`);
    return res.data;
  },

  recordBedsideCare: async (dto: NursingCareRecordDto): Promise<ApiResponse<NursingCareRecordDto>> => {
    const res = await apiClient.post<ApiResponse<NursingCareRecordDto>>("/api/v1/nurses/bedside-care", dto);
    return res.data;
  },

  getPatientBedsideCareHistory: async (patientId: string): Promise<ApiResponse<NursingCareRecordDto[]>> => {
    const res = await apiClient.get<ApiResponse<NursingCareRecordDto[]>>(`/api/v1/nurses/bedside-care/patient/${patientId}`);
    return res.data;
  },

  getWardTasks: async (wardId?: string): Promise<ApiResponse<NursingTaskDto[]>> => {
    const res = await apiClient.get<ApiResponse<NursingTaskDto[]>>("/api/v1/nurses/tasks", {
      params: wardId ? { wardId } : undefined,
    });
    return res.data;
  },

  createNursingTask: async (dto: NursingTaskDto): Promise<ApiResponse<NursingTaskDto>> => {
    const res = await apiClient.post<ApiResponse<NursingTaskDto>>("/api/v1/nurses/tasks", dto);
    return res.data;
  },

  completeNursingTask: async (taskId: string, completionNotes?: string): Promise<ApiResponse<NursingTaskDto>> => {
    const res = await apiClient.patch<ApiResponse<NursingTaskDto>>(`/api/v1/nurses/tasks/${taskId}/complete`, null, {
      params: completionNotes ? { completionNotes } : undefined,
    });
    return res.data;
  },

  createClinicalEscalation: async (dto: ClinicalEscalationDto): Promise<ApiResponse<ClinicalEscalationDto>> => {
    const res = await apiClient.post<ApiResponse<ClinicalEscalationDto>>("/api/v1/nurses/escalations", dto);
    return res.data;
  },

  getWardEscalations: async (wardId?: string): Promise<ApiResponse<ClinicalEscalationDto[]>> => {
    const res = await apiClient.get<ApiResponse<ClinicalEscalationDto[]>>("/api/v1/nurses/escalations", {
      params: wardId ? { wardId } : undefined,
    });
    return res.data;
  },

  acknowledgeEscalation: async (escalationId: string, doctorResponse?: string): Promise<ApiResponse<ClinicalEscalationDto>> => {
    const res = await apiClient.patch<ApiResponse<ClinicalEscalationDto>>(`/api/v1/nurses/escalations/${escalationId}/acknowledge`, null, {
      params: doctorResponse ? { doctorResponse } : undefined,
    });
    return res.data;
  },

  recordAssessment: async (dto: NursingAssessmentDto): Promise<ApiResponse<NursingAssessmentDto>> => {
    const res = await apiClient.post<ApiResponse<NursingAssessmentDto>>("/api/v1/nurses/assessments", dto);
    return res.data;
  },

  getPatientAssessments: async (patientId: string): Promise<ApiResponse<NursingAssessmentDto[]>> => {
    const res = await apiClient.get<ApiResponse<NursingAssessmentDto[]>>(`/api/v1/nurses/assessments/patient/${patientId}`);
    return res.data;
  },

  reportIncident: async (dto: NursingIncidentDto): Promise<ApiResponse<NursingIncidentDto>> => {
    const res = await apiClient.post<ApiResponse<NursingIncidentDto>>("/api/v1/nurses/incidents", dto);
    return res.data;
  },

  getWardIncidents: async (wardId?: string): Promise<ApiResponse<NursingIncidentDto[]>> => {
    const res = await apiClient.get<ApiResponse<NursingIncidentDto[]>>("/api/v1/nurses/incidents", {
      params: wardId ? { wardId } : undefined,
    });
    return res.data;
  },

  createShiftHandover: async (dto: ShiftHandoverReportDto): Promise<ApiResponse<ShiftHandoverReportDto>> => {
    const res = await apiClient.post<ApiResponse<ShiftHandoverReportDto>>("/api/v1/nurses/handovers", dto);
    return res.data;
  },

  getWardHandovers: async (wardId?: string): Promise<ApiResponse<ShiftHandoverReportDto[]>> => {
    const res = await apiClient.get<ApiResponse<ShiftHandoverReportDto[]>>("/api/v1/nurses/handovers", {
      params: wardId ? { wardId } : undefined,
    });
    return res.data;
  },

  getInpatientSummary: async (patientId: string): Promise<ApiResponse<InpatientSummaryDto>> => {
    const res = await apiClient.get<ApiResponse<InpatientSummaryDto>>(`/api/v1/nurses/inpatient-summary/${patientId}`);
    return res.data;
  },
};
