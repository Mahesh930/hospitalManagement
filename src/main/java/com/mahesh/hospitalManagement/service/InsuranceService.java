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

    @Transactional
    public Patient assignInsuranceToPatient(Insurance insurance, Long patientId){
        Patient patient = patientRepository.findById(patientId).
                orElseThrow(() -> new EntityNotFoundException("Patient Not found with id! "+patientId));

        patient.setInsurance(insurance);
        insurance.setPatient(patient); // bidirectional consistency maintenance

        return patient;

    }

    @Transactional
    public Patient disaccociateInsuranceFromPatient(Long patientId){
        Patient patient = patientRepository.findById(patientId).
                orElseThrow(() -> new EntityNotFoundException("Patient Not found with id! "+patientId));

        patient.setInsurance(null);
        return patient;
    }
}
