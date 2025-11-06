package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.mahesh.hospitalManagement.repository.PatientRepository;

import java.util.List;

@SpringBootTest
public class PatientTest {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientService patientService;

    @Test
    public void testPatientRepository(){

        List<Patient> patientList=patientRepository.findAll();
        System.out.println(patientList);

        Patient p1 = new Patient();
        patientRepository.save(p1);
    }

    @Test
    public void testTransactionMethods() {
//    Patient patient = patientService.getPatientById(1L);
//    }
//        Patient patient = patientRepository.findByName("Mahi");
//        System.out.println(patient);
//        Patient patient1 = patientRepository.findByEmail("mahesh@gmail.com");
//        System.out.println(patient1);

    }
}
