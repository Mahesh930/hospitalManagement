package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.service.OPDConsultationService;
import com.mahesh.hospitalManagement.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class OPDConsultationTest {

    @Autowired
    private PatientService patientService;

    @Autowired
    private OPDConsultationService consultationService;

    @Test
    public void testDrugAllergyHardBlocker() {
        PatientDto patientDto = PatientDto.builder()
                .name("John Doe")
                .phone("9998887776")
                .birthDate(LocalDate.of(1990, 1, 1))
                .allergies(List.of(
                        PatientDto.AllergyDto.builder()
                                .allergen("Penicillin")
                                .severity("SEVERE")
                                .reaction("Anaphylaxis")
                                .build()
                ))
                .build();

        PatientDto registered = patientService.registerPatient(patientDto, "TEST_ADMIN");

        OPDConsultationDto.PrescriptionItemDto item = OPDConsultationDto.PrescriptionItemDto.builder()
                .medicineName("Penicillin")
                .dosage("500mg")
                .frequency("1-0-1")
                .durationDays(5)
                .build();

        OPDConsultationDto dto = OPDConsultationDto.builder()
                .prescription(OPDConsultationDto.PrescriptionDto.builder()
                        .advice("Rest")
                        .items(List.of(item))
                        .build())
                .build();

        // Expect BusinessValidationException due to drug allergy hard blocker
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            consultationService.startOrCreateConsultation(java.util.UUID.randomUUID(), dto, "TEST_DOCTOR");
        });

        assertTrue(ex.getMessage().contains("CRITICAL SAFETY BLOCKER"));
    }
}
