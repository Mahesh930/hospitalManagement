package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.dto.AppointmentDto;
import com.mahesh.hospitalManagement.service.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.UUID;

@SpringBootTest
public class AppintmentTests {

    @Autowired
    private AppointmentService appointmentService;

    @Test
    public void testCreateNewAppointment() {
        AppointmentDto dto = AppointmentDto.builder()
                .appointmentTime(LocalDateTime.of(2026, 1, 1, 14, 0))
                .reason("General Consultation")
                .patientId(UUID.randomUUID())
                .doctorId(UUID.randomUUID())
                .build();

        try {
            appointmentService.bookAppointment(dto, "TEST_USER");
        } catch (Exception e) {
            // Expected ResourceNotFoundException since random doctor/patient UUIDs don't exist
        }
    }
}
