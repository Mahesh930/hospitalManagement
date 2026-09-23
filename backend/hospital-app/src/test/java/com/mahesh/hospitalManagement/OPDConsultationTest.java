package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.entity.Appointment;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.repository.AppointmentRepository;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import com.mahesh.hospitalManagement.service.OPDConsultationService;
import com.mahesh.hospitalManagement.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class OPDConsultationTest {

    @Autowired
    private PatientService patientService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

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
        System.out.println("Registered test patient UHID: " + registered.getUhid());

        Patient patientEntity = patientRepository.findById(registered.getId()).orElseThrow();

        Doctor doctor = Doctor.builder()
                .name("Dr. Smith")
                .consultationFee(500.0)
                .email("dr.smith@hospital.com")
                .build();
        doctor = doctorRepository.save(doctor);

        Appointment appointment = Appointment.builder()
                .patient(patientEntity)
                .doctor(doctor)
                .appointmentTime(LocalDateTime.now())
                .status("BOOKED")
                .build();
        appointment = appointmentRepository.save(appointment);

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

        final UUID appointmentId = appointment.getId();
        // Expect BusinessValidationException due to drug allergy hard blocker
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> {
            consultationService.startOrCreateConsultation(appointmentId, dto, "TEST_DOCTOR");
        });

        assertTrue(ex.getMessage().contains("CRITICAL SAFETY BLOCKER"));
    }
}
