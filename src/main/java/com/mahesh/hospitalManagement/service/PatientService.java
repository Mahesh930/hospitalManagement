package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;

    @Transactional // this anotation is usefull for database transaction management
    //  If anything throws an exception here, changes will be rolled back
    public Patient getPatientById(Long id){
        Patient p1 = patientRepository.findById(id).orElseThrow();

        Patient p2 = patientRepository.findById(id).orElseThrow();

//        p1.setName("Mahi");


        return p1;
    }
}
