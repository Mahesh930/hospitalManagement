package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.entity.Appointment;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.repository.AppointmentRepository;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public Appointment createNewAppointment(Appointment appointment, long doctorId, long patientId){
        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow();
        Patient patient = patientRepository.findById(patientId).orElseThrow();

        if(appointment.getId() != null) throw new IllegalArgumentException("Appointment id is already present ");

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        patient.getAppointments().add(appointment); // to maintain bie directional consistency

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment reAssignAppointmentToAnotherDoctor(Long appointmentId, Long doctorId){

        Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow();

        appointment.setDoctor(doctor); // this will automatically call the update. because it si dirty now

        doctor.getAppointments().add(appointment); // for bie directional consistency

        return appointment;


    }
}
