package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.entity.PatientAllergy;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.PatientAllergyRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
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
    private final AuditService auditService;

    @Transactional
    public PatientDto registerPatient(PatientDto requestDto, String currentUser) {
        if (requestDto.getPhone() != null && patientRepository.findByPhone(requestDto.getPhone()).isPresent()) {
            throw new BusinessValidationException("Patient with phone number " + requestDto.getPhone() + " already exists.");
        }

        String uhid = generateUHID();

        Patient patient = Patient.builder()
                .uhid(uhid)
                .abhaId(requestDto.getAbhaId())
                .name(requestDto.getName())
                .birthDate(requestDto.getBirthDate())
                .age(requestDto.getAge())
                .phone(requestDto.getPhone())
                .email(requestDto.getEmail())
                .gender(requestDto.getGender())
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
        return patientRepository.searchPatients(query).stream()
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
                .birthDate(patient.getBirthDate())
                .age(patient.getAge())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .gender(patient.getGender())
                .allergies(allergyDtos)
                .build();
    }
}
