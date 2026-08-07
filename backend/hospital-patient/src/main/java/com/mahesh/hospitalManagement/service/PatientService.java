package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.entity.PatientAllergy;
import com.mahesh.hospitalManagement.entity.type.BloodGroupType;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.PatientAllergyRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import com.mahesh.hospitalManagement.repository.UserRepository;
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
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));
        return mapToDto(patient);
    }

    @Transactional(readOnly = true)
    public PatientDto getPatientByUhid(String uhid) {
        Patient patient = patientRepository.findByUhid(uhid)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with UHID: " + uhid));
        return mapToDto(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientDto> searchPatients(String query) {
        List<Patient> patients = (query == null || query.isBlank()) 
                ? patientRepository.findAllActivePatients()
                : patientRepository.searchPatients(query);
        return patients.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
                .allergies(allergyDtos)
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
