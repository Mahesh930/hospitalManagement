package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.entity.Insurance;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.repository.InsuranceRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.swing.*;

@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;

    /**
     * Assigns insurance details to a specific patient.
     * Maintains bidirectional consistency between Patient and Insurance entities.
     * @param insurance The Insurance entity to assign.
     * @param patientId The ID of the patient.
     * @return The updated Patient entity.
     */
    @Transactional
    public Patient assignInsuranceToPatient(Insurance insurance, Long patientId){
        Patient patient = patientRepository.findById(patientId).
                orElseThrow(() -> new EntityNotFoundException("Patient not found with id: "+patientId));

        patient.setInsurance(insurance);
        insurance.setPatient(patient); // bidirectional consistency maintenance

        return patient;
    }

    /**
     * Removes insurance association from a patient.
     * @param patientId The ID of the patient.
     * @return The updated Patient entity.
     */
    @Transactional
    public Patient disassociateInsuranceFromPatient(Long patientId){
        Patient patient = patientRepository.findById(patientId).
                orElseThrow(() -> new EntityNotFoundException("Patient not found with id: "+patientId));

        patient.setInsurance(null);
        return patient;
    }
}
