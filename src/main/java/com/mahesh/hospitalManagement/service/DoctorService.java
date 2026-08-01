package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    public List<DoctorResponseDto> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnboardDoctorRequestDto dto) {
        log.info("Onboarding new doctor for user ID: {}", dto.getUserId());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.getUserId()));

        if (doctorRepository.findByUserId(dto.getUserId()).isPresent()) {
            throw new IllegalArgumentException("User is already registered as a doctor");
        }

        Doctor doctor = Doctor.builder()
                .name(dto.getName())
                .specialization(dto.getSpecialization())
                .registrationNumber(dto.getRegistrationNumber())
                .consultationFee(dto.getConsultationFee() != null ? dto.getConsultationFee() : 500.0)
                .email(dto.getEmail() != null ? dto.getEmail() : user.getUsername() + "@medicore.local")
                .user(user)
                .build();

        user.getRoles().add(RoleType.DOCTOR);
        userRepository.save(user);

        Doctor savedDoctor = doctorRepository.save(doctor);
        log.info("Successfully onboarded doctor: {}", savedDoctor.getName());

        return modelMapper.map(savedDoctor, DoctorResponseDto.class);
    }
}