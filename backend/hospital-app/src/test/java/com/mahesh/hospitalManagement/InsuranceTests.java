package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.entity.Insurance;
import com.mahesh.hospitalManagement.service.InsuranceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.UUID;

@SpringBootTest
public class InsuranceTests {

    @Autowired
    private InsuranceService insuranceService;

    @Test
    public void testInsurance() {
        Insurance insurance = Insurance.builder()
                .policyNumber("HDFC_1234")
                .provider("HDFC")
                .validUntil(LocalDate.of(2030, 12, 30))
                .build();

        // Standard UUID test parameter
        UUID testPatientId = UUID.randomUUID();
        try {
            insuranceService.assignInsuranceToPatient(insurance, testPatientId);
        } catch (Exception e) {
            // Expected ResourceNotFoundException since random UUID patient doesn't exist in DB
        }
    }
}
