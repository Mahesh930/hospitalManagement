package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.dto.PatientTimelineDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientAllergyRepository allergyRepository;
    private final UserRepository userRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final OPDConsultationRepository opdConsultationRepository;
    private final BedAdmissionRepository bedAdmissionRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public PatientDto registerPatient(PatientDto requestDto, String currentUser) {
        if (requestDto.getPhone() != null && patientRepository.findByPhone(requestDto.getPhone()).isPresent()) {
            throw new BusinessValidationException("Patient with phone number " + requestDto.getPhone() + " already exists.");
        }

        String uhid = generateUHID();

        // Auto-create linked User account for Patient login (Credentials: Email/Phone, Default Password: Password@123)
        String userUsername = (requestDto.getEmail() != null && !requestDto.getEmail().isBlank()) 
                ? requestDto.getEmail() 
                : (requestDto.getPhone() != null ? requestDto.getPhone() : uhid);

        com.mahesh.hospitalManagement.entity.User patientUser = userRepository.findByUsername(userUsername)
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.User newUser = com.mahesh.hospitalManagement.entity.User.builder()
                            .username(userUsername)
                            .phone(requestDto.getPhone())
                            .password(passwordEncoder.encode("Password@123"))
                            .providerType(com.mahesh.hospitalManagement.entity.type.AuthProviderType.EMAIL)
                            .roles(Set.of(com.mahesh.hospitalManagement.entity.type.RoleType.PATIENT))
                            .build();
                    return userRepository.save(newUser);
                });

        Patient patient = Patient.builder()
                .uhid(uhid)
                .abhaId(requestDto.getAbhaId())
                .name(requestDto.getName())
                .middleName(requestDto.getMiddleName())
                .lastName(requestDto.getLastName())
                .birthDate(requestDto.getBirthDate())
                .age(requestDto.getAge())
                .phone(requestDto.getPhone())
                .altPhone(requestDto.getAltPhone())
                .email(requestDto.getEmail())
                .gender(requestDto.getGender())
                .bloodGroup(parseBloodGroup(requestDto.getBloodGroup()))
                .maritalStatus(requestDto.getMaritalStatus())
                .occupation(requestDto.getOccupation())
                .aadhaar(requestDto.getAadhaar())
                .pan(requestDto.getPan())
                .address(requestDto.getAddress())
                .city(requestDto.getCity())
                .state(requestDto.getState())
                .pincode(requestDto.getPincode())
                .emergencyContactName(requestDto.getEmergencyContactName())
                .emergencyContactRelation(requestDto.getEmergencyContactRelation())
                .emergencyContactPhone(requestDto.getEmergencyContactPhone())
                .existingDiseases(requestDto.getExistingDiseases())
                .previousSurgeries(requestDto.getPreviousSurgeries())
                .disabilityStatus(requestDto.getDisabilityStatus())
                .pregnancyStatus(requestDto.getPregnancyStatus())
                .corporatePatient(requestDto.getCorporatePatient())
                .tpaDetails(requestDto.getTpaDetails())
                .qrCodeData("UHID:" + uhid + "|NAME:" + requestDto.getName() + "|PHONE:" + requestDto.getPhone())
                .isEmergency(requestDto.getIsEmergency() != null ? requestDto.getIsEmergency() : false)
                .user(patientUser)
                .build();

        Patient saved = patientRepository.save(patient);

        if (requestDto.getAllergies() != null && !requestDto.getAllergies().isEmpty()) {
            List<PatientAllergy> allergies = requestDto.getAllergies().stream()
                    .map(a -> PatientAllergy.builder()
                            .patient(saved)
                            .allergen(a.getAllergen())
                            .severity(a.getSeverity())
                            .reaction(a.getReaction())
                            .build())
                    .collect(Collectors.toList());
            allergyRepository.saveAll(allergies);
            saved.setAllergies(allergies);
        }

        auditService.logAction(currentUser, "REGISTER_PATIENT", null, saved.getUhid(), null, null, null);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public PatientDto getPatientById(UUID id) {
        return getPatientById(id, null);
    }

    @Transactional(readOnly = true)
    public PatientDto getPatientById(UUID id, String currentUser) {
        validateNursePatientAccess(id, currentUser);
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));
        return mapToDto(patient);
    }

    @Transactional(readOnly = true)
    public PatientDto getPatientByUhid(String uhid) {
        return getPatientByUhid(uhid, null);
    }

    @Transactional(readOnly = true)
    public PatientDto getPatientByUhid(String uhid, String currentUser) {
        validateNursePatientAccessByUhid(uhid, currentUser);
        Patient patient = patientRepository.findByUhid(uhid)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with UHID: " + uhid));
        return mapToDto(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientDto> searchPatients(String query) {
        return searchPatients(query, null, null);
    }

    @Transactional(readOnly = true)
    public List<PatientDto> searchPatients(String query, UUID hospitalId) {
        return searchPatients(query, hospitalId, null);
    }

    @Transactional(readOnly = true)
    public List<PatientDto> searchPatients(String query, UUID hospitalId, String currentUser) {
        if (isRestrictedNurse(currentUser)) {
            Ward ward = getNurseAssignedWard(currentUser);
            List<BedAdmission> activeAdmissions;
            if (ward != null) {
                activeAdmissions = bedAdmissionRepository.findActiveAdmissionsByWard(ward.getId());
            } else {
                activeAdmissions = bedAdmissionRepository.findAllActiveAdmissions();
            }

            String q = (query != null) ? query.trim().toLowerCase() : "";

            return activeAdmissions.stream()
                    .filter(ba -> ba.getPatient() != null && ba.getPatient().getDeletedAt() == null)
                    .filter(ba -> {
                        if (q.isEmpty()) return true;
                        Patient p = ba.getPatient();
                        boolean nameMatch = p.getName() != null && p.getName().toLowerCase().contains(q);
                        boolean phoneMatch = p.getPhone() != null && p.getPhone().contains(q);
                        boolean uhidMatch = p.getUhid() != null && p.getUhid().toLowerCase().contains(q);
                        return nameMatch || phoneMatch || uhidMatch;
                    })
                    .map(ba -> {
                        PatientDto dto = mapToDto(ba.getPatient());
                        if (ba.getBed() != null) {
                            dto.setCurrentBedNumber(ba.getBed().getBedNumber());
                            if (ba.getBed().getWard() != null) {
                                dto.setCurrentWardName(ba.getBed().getWard().getName());
                            }
                        }
                        dto.setAdmissionStatus(ba.getStatus());
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        List<Patient> patients;
        if (hospitalId != null) {
            patients = (query == null || query.isBlank())
                    ? patientRepository.findAllActivePatientsByHospital(hospitalId)
                    : patientRepository.searchPatientsByHospital(query, hospitalId);
        } else {
            patients = (query == null || query.isBlank())
                    ? patientRepository.findAllActivePatients()
                    : patientRepository.searchPatients(query);
        }
        return patients.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private boolean isRestrictedNurse(String username) {
        if (username == null || username.isBlank()) return false;
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return false;
        User user = userOpt.get();
        Set<com.mahesh.hospitalManagement.entity.type.RoleType> roles = user.getRoles();
        if (roles == null) return false;
        if (roles.contains(com.mahesh.hospitalManagement.entity.type.RoleType.SUPER_ADMIN)
                || roles.contains(com.mahesh.hospitalManagement.entity.type.RoleType.ADMIN)
                || roles.contains(com.mahesh.hospitalManagement.entity.type.RoleType.RECEPTIONIST)) {
            return false;
        }
        return roles.contains(com.mahesh.hospitalManagement.entity.type.RoleType.NURSE);
    }

    private Ward getNurseAssignedWard(String username) {
        return userRepository.findByUsername(username)
                .map(User::getAssignedWard)
                .orElse(null);
    }

    private void validateNursePatientAccess(UUID patientId, String username) {
        if (!isRestrictedNurse(username)) return;

        Ward ward = getNurseAssignedWard(username);
        boolean isAdmittedInWard;
        if (ward != null) {
            isAdmittedInWard = bedAdmissionRepository
                    .findActiveAdmissionByPatientAndWard(patientId, ward.getId())
                    .isPresent();
        } else {
            isAdmittedInWard = bedAdmissionRepository
                    .findByPatientIdAndStatusAndDeletedAtIsNull(patientId, "ADMITTED")
                    .isPresent();
        }

        if (!isAdmittedInWard) {
            throw new BusinessValidationException("Access Denied: Patient is no longer admitted in your assigned ward or has been discharged.");
        }
    }

    private void validateNursePatientAccessByUhid(String uhid, String username) {
        if (!isRestrictedNurse(username)) return;

        Ward ward = getNurseAssignedWard(username);
        boolean isAdmittedInWard;
        if (ward != null) {
            isAdmittedInWard = bedAdmissionRepository
                    .findActiveAdmissionByPatientUhidAndWard(uhid, ward.getId())
                    .isPresent();
        } else {
            Patient p = patientRepository.findByUhid(uhid).orElse(null);
            isAdmittedInWard = p != null && bedAdmissionRepository
                    .findByPatientIdAndStatusAndDeletedAtIsNull(p.getId(), "ADMITTED")
                    .isPresent();
        }

        if (!isAdmittedInWard) {
            throw new BusinessValidationException("Access Denied: Patient is no longer admitted in your assigned ward or has been discharged.");
        }
    }

    @Transactional
    public PatientDto addAllergy(UUID patientId, PatientDto.AllergyDto allergyDto, String currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        PatientAllergy allergy = PatientAllergy.builder()
                .patient(patient)
                .allergen(allergyDto.getAllergen())
                .severity(allergyDto.getSeverity())
                .reaction(allergyDto.getReaction())
                .build();

        allergyRepository.save(allergy);
        auditService.logAction(currentUser, "ADD_PATIENT_ALLERGY", null, allergyDto.getAllergen(), null, null, null);

        return getPatientById(patientId);
    }

    private String generateUHID() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%04d", new Random().nextInt(10000));
        return "UHID-" + datePart + "-" + randomPart;
    }

    public PatientDto mapToDto(Patient patient) {
        List<PatientDto.AllergyDto> allergyDtos = Optional.ofNullable(patient.getAllergies())
                .orElse(Collections.emptyList())
                .stream()
                .map(a -> PatientDto.AllergyDto.builder()
                        .id(a.getId())
                        .allergen(a.getAllergen())
                        .severity(a.getSeverity())
                        .reaction(a.getReaction())
                        .build())
                .collect(Collectors.toList());

        return PatientDto.builder()
                .id(patient.getId())
                .uhid(patient.getUhid())
                .abhaId(patient.getAbhaId())
                .name(patient.getName())
                .middleName(patient.getMiddleName())
                .lastName(patient.getLastName())
                .birthDate(patient.getBirthDate())
                .age(patient.getAge())
                .phone(patient.getPhone())
                .altPhone(patient.getAltPhone())
                .email(patient.getEmail())
                .gender(patient.getGender())
                .bloodGroup(formatBloodGroup(patient.getBloodGroup()))
                .maritalStatus(patient.getMaritalStatus())
                .occupation(patient.getOccupation())
                .aadhaar(patient.getAadhaar())
                .pan(patient.getPan())
                .address(patient.getAddress())
                .city(patient.getCity())
                .state(patient.getState())
                .pincode(patient.getPincode())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactRelation(patient.getEmergencyContactRelation())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .existingDiseases(patient.getExistingDiseases())
                .previousSurgeries(patient.getPreviousSurgeries())
                .disabilityStatus(patient.getDisabilityStatus())
                .pregnancyStatus(patient.getPregnancyStatus())
                .corporatePatient(patient.getCorporatePatient())
                .tpaDetails(patient.getTpaDetails())
                .qrCodeData(patient.getQrCodeData())
                .isEmergency(patient.getIsEmergency())
                .hospitalId(patient.getHospital() != null ? patient.getHospital().getId() : null)
                .hospitalName(patient.getHospital() != null ? patient.getHospital().getName() : null)
                .allergies(allergyDtos)
                .build();
    }

    /**
     * Retrieves the complete longitudinal medical record and chronological encounters for a patient.
     *
     * @param patientId Unique UUID of patient.
     * @return PatientTimelineDto containing allergies, past vitals, and chronological OPD encounters.
     */
    @Transactional(readOnly = true)
    public PatientTimelineDto getPatientLongitudinalTimeline(UUID patientId) {
        return getPatientLongitudinalTimeline(patientId, null);
    }

    @Transactional(readOnly = true)
    public PatientTimelineDto getPatientLongitudinalTimeline(UUID patientId, String currentUser) {
        validateNursePatientAccess(patientId, currentUser);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        List<PatientDto.AllergyDto> allergyDtos = (patient.getAllergies() == null) ? Collections.emptyList() :
                patient.getAllergies().stream()
                        .map(a -> PatientDto.AllergyDto.builder()
                                .id(a.getId())
                                .allergen(a.getAllergen())
                                .severity(a.getSeverity())
                                .reaction(a.getReaction())
                                .build())
                        .collect(Collectors.toList());

        List<VitalSigns> vitalsList = vitalSignsRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        List<PatientTimelineDto.TimelineVitalDto> vitalDtos = vitalsList.stream()
                .map(v -> PatientTimelineDto.TimelineVitalDto.builder()
                        .id(v.getId())
                        .bloodPressure(v.getBloodPressure())
                        .pulseRate(v.getPulseRate())
                        .temperature(v.getTemperature())
                        .weightKg(v.getWeightKg())
                        .spo2(v.getSpo2())
                        .isAbnormal(v.getIsAbnormal())
                        .recordedAt(v.getRecordedAt() != null ? v.getRecordedAt() : v.getCreatedAt())
                        .recordedBy(v.getRecordedBy())
                        .build())
                .collect(Collectors.toList());

        List<OPDConsultation> consultations = opdConsultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        List<PatientTimelineDto.TimelineEncounterDto> encounters = consultations.stream()
                .map(c -> {
                    List<PatientTimelineDto.TimelinePrescriptionItemDto> rxItems = Collections.emptyList();
                    String advice = null;
                    if (c.getPrescription() != null) {
                        advice = c.getPrescription().getAdvice();
                        if (c.getPrescription().getItems() != null) {
                            rxItems = c.getPrescription().getItems().stream()
                                    .map(item -> PatientTimelineDto.TimelinePrescriptionItemDto.builder()
                                            .medicineName(item.getMedicineName())
                                            .dosage(item.getDosage())
                                            .frequency(item.getFrequency())
                                            .durationDays(item.getDurationDays())
                                            .instructions(item.getInstructions())
                                            .build())
                                    .collect(Collectors.toList());
                        }
                    }

                    String docName = (c.getDoctor() != null) ? c.getDoctor().getName() : "Attending Doctor";
                    String deptName = (c.getDoctor() != null && c.getDoctor().getSpecialization() != null)
                            ? c.getDoctor().getSpecialization() : "General OPD";

                    return PatientTimelineDto.TimelineEncounterDto.builder()
                            .encounterId(c.getId())
                            .appointmentId(c.getAppointment() != null ? c.getAppointment().getId() : null)
                            .encounterDate(c.getCreatedAt())
                            .visitType("OPD")
                            .doctorName(docName)
                            .departmentName(deptName)
                            .icdCode(c.getIcdCode())
                            .diagnosisNotes(c.getDiagnosisNotes())
                            .advice(advice)
                            .status(c.getStatus())
                            .bloodPressure(c.getBloodPressure())
                            .pulseRate(c.getPulseRate())
                            .temperature(c.getTemperature())
                            .weight(c.getWeight())
                            .prescriptionItems(rxItems)
                            .build();
                })
                .collect(Collectors.toList());

        return PatientTimelineDto.builder()
                .patientId(patient.getId())
                .uhid(patient.getUhid())
                .name(patient.getName())
                .age(patient.getAge())
                .gender(patient.getGender())
                .bloodGroup(formatBloodGroup(patient.getBloodGroup()))
                .phone(patient.getPhone())
                .existingDiseases(patient.getExistingDiseases())
                .previousSurgeries(patient.getPreviousSurgeries())
                .allergies(allergyDtos)
                .recentVitals(vitalDtos)
                .encounters(encounters)
                .build();
    }

    /**
     * Converts blood group string (e.g. "O+", "A-") to BloodGroupType enum.
     */
    private com.mahesh.hospitalManagement.entity.type.BloodGroupType parseBloodGroup(String bg) {
        if (bg == null || bg.isBlank()) return null;
        String clean = bg.trim().toUpperCase().replace("+", "_POSITIVE").replace("-", "_NEGATIVE");
        try {
            return com.mahesh.hospitalManagement.entity.type.BloodGroupType.valueOf(clean);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Converts BloodGroupType enum to readable string (e.g. "O+").
     */
    private String formatBloodGroup(com.mahesh.hospitalManagement.entity.type.BloodGroupType bg) {
        if (bg == null) return null;
        return bg.name().replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
    }
}
