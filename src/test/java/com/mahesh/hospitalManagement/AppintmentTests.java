package com.mahesh.hospitalManagement;

import com.mahesh.hospitalManagement.entity.Appointment;
import com.mahesh.hospitalManagement.dto.CreateAppointmentRequestDto;
import com.mahesh.hospitalManagement.service.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

@SpringBootTest
public class AppintmentTests {

    @Autowired
    private AppointmentService appointmentService;

    @Test
    public void testCreateNewAppointment() {
        CreateAppointmentRequestDto dto = new CreateAppointmentRequestDto();
        dto.setAppointmentTime(LocalDateTime.of(2026, 1, 1, 14, 0));
        dto.setReason("General");
        dto.setPatientId(1L);
        dto.setDoctorId(2L);

        var newAppointment = appointmentService.createNewAppointment(dto);

        System.out.println(newAppointment);
    }

    @Test
    public void testReAssignAppointmentToAnotherDoctor() {
        CreateAppointmentRequestDto dto = new CreateAppointmentRequestDto();
        dto.setAppointmentTime(LocalDateTime.of(2026, 1, 1, 14, 0));
        dto.setReason("General");
        dto.setPatientId(2L);
        dto.setDoctorId(2L);

        var newAppointment = appointmentService.createNewAppointment(dto);

        System.out.println(newAppointment);
    }
}
