package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.PatientResponseDto;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;

    /**
     * Retrieves a patient by their unique ID.
     * @param id The ID of the patient to retrieve.
     * @return PatientResponseDto containing patient details.
     * @throws RuntimeException if patient is not found.
     */
    @Transactional
    public PatientResponseDto getPatientById(Long id){
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));
        return modelMapper.map(patient, PatientResponseDto.class);
    }

    /**
     * Retrieves a paginated list of all patients.
     * @param pageNumber The page number to retrieve.
     * @param pageSize The number of patients per page.
     * @return List of PatientResponseDto.
     */
    public List<PatientResponseDto> getAllPatients(Integer pageNumber, Integer pageSize) {
        return patientRepository.findAllPatients(PageRequest.of(pageNumber, pageSize))
                .stream()
                .map(patient -> modelMapper.map(patient, PatientResponseDto.class))
                .collect(Collectors.toList());
    }
}
