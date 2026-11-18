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

    PatientDocumentDto verifyPatientDocument(UUID documentId, String currentUser);

    DuplicateCheckDto checkDuplicatePatient(String phone, String name, String email, String aadhaar);

    PatientMergeRequestDto createMergeRequest(PatientMergeRequestDto dto, String currentUser);

    List<PatientMergeRequestDto> getMergeRequests(String status);

    List<DoctorScheduleDto> getDoctorSchedules();

    InsuranceDetailsDto assignPatientInsurance(UUID patientId, InsuranceDetailsDto dto, String currentUser);

    InsuranceDetailsDto getPatientInsurance(UUID patientId);

    DiagnosticBookingDto scheduleDiagnosticBooking(DiagnosticBookingDto dto, String currentUser);

    List<DiagnosticBookingDto> getDiagnosticBookings(UUID patientId, String status);

    ReceptionShiftHandoverDto createShiftHandover(ReceptionShiftHandoverDto dto, String currentUser);

    List<ReceptionShiftHandoverDto> getShiftHandovers(LocalDate date);

    PatientFeedbackDto registerPatientFeedback(PatientFeedbackDto dto, String currentUser);

    List<PatientFeedbackDto> getPatientFeedbacks(UUID patientId, String status);

    PatientFeedbackDto resolvePatientFeedback(UUID feedbackId, String resolutionNotes, String currentUser);

    LostAndFoundItemDto recordLostAndFound(LostAndFoundItemDto dto, String currentUser);

    List<LostAndFoundItemDto> getLostAndFoundItems(String status);

    LostAndFoundItemDto claimLostAndFound(UUID itemId, String claimedBy, String claimantContact, String claimantIdProof, String remarks, String currentUser);
}
