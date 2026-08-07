package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReceptionistService {

    ReceptionistDashboardDto getDashboardStats();

    VitalSignsDto recordVitalSigns(VitalSignsDto dto, String currentUser);

    VitalSignsDto getVitalSignsForAppointment(UUID appointmentId);

    QueueManagementDto issueWalkinToken(WalkinTokenRequestDto dto, String currentUser);

    PatientDto registerEmergencyPatient(EmergencyRegistrationDto dto, String currentUser);

    List<QueueManagementDto> getDoctorLiveQueue(UUID doctorId);

    QueueManagementDto updateQueueStatus(UUID visitId, String status, Integer priorityRank, UUID newDoctorId, String currentUser);

    DailyReceptionistReportDto getDailyReport(LocalDate reportDate);

    PatientDocumentDto uploadPatientDocument(UUID patientId, PatientDocumentDto dto, String currentUser);

    List<PatientDocumentDto> getPatientDocuments(UUID patientId);
}
