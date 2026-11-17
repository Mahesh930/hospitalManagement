package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.HospitalDto;
import com.mahesh.hospitalManagement.entity.Department;
import com.mahesh.hospitalManagement.entity.Hospital;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.DepartmentRepository;
import com.mahesh.hospitalManagement.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    @Transactional
    public HospitalDto provisionHospital(HospitalDto dto, String currentUser) {
        if (hospitalRepository.findByRegistrationNumber(dto.getRegistrationNumber()).isPresent()) {
            throw new BusinessValidationException("Hospital with registration number " + dto.getRegistrationNumber() + " already exists.");
        }

        Hospital hospital = Hospital.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .registrationNumber(dto.getRegistrationNumber())
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .build();

        Hospital saved = hospitalRepository.save(hospital);

        // Pre-create default departments (General OPD, Billing, Pharmacy) per PRD US-110
        createDefaultDepartment(saved, "General OPD", "OPD");
        createDefaultDepartment(saved, "Billing", "BILL");
        createDefaultDepartment(saved, "Pharmacy", "PHARM");

        auditService.logAction(currentUser, "PROVISION_HOSPITAL", null, saved.getName(), null, null, null);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public HospitalDto getHospital(UUID id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));
        return mapToDto(hospital);
    }

    @Transactional(readOnly = true)
    public List<HospitalDto> getAllHospitals() {
        return hospitalRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private void createDefaultDepartment(Hospital hospital, String name, String code) {
        Department dept = Department.builder()
                .hospital(hospital)
                .name(name)
                .code(code)
                .build();
        departmentRepository.save(dept);
    }

    public HospitalDto mapToDto(Hospital hospital) {
        return HospitalDto.builder()
                .id(hospital.getId())
                .name(hospital.getName())
                .address(hospital.getAddress())
                .registrationNumber(hospital.getRegistrationNumber())
                .status(hospital.getStatus())
                .build();
    }
}
