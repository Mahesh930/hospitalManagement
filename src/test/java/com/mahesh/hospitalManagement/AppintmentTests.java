package com.mahesh.hospitalManagement;


import com.mahesh.hospitalManagement.entity.Appointment;
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
    public void testCreateNewAppointment(){
        Appointment appointment = Appointment.builder()
                .appointmentTime(LocalDateTime.of(2026, 1,1, 14,0))
                .reason("General")
                .build();

        var newAppointment =appointmentService.createNewAppointment(appointment, 1L, 2L);

        System.out.println(newAppointment);
    }

    @Test
    public void testReAssignAppointmentToAnotherDoctor(){
        Appointment appointment = Appointment.builder()
                .appointmentTime(LocalDateTime.of(2026, 1,1, 14,0))
                .reason("General")
                .build();

        var newAppointment =appointmentService.createNewAppointment(appointment, 2L, 2L);

        System.out.println(newAppointment);
    }
}
