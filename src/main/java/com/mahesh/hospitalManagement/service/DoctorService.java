package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    /**
     * Retrieves all doctors registered in the system.
     * @return List of DoctorResponseDto.
     */
    public List<DoctorResponseDto> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }


    /**
     * Onboards a new doctor by associating a user account with doctor details.
     * Updates the user's role to include DOCTOR.
     * @param onBoardDoctorRequestDto DTO containing user ID and doctor details.
     * @return DoctorResponseDto of the onboarded doctor.
     */
    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnboardDoctorRequestDto onBoardDoctorRequestDto) {
        log.info("Onboarding new doctor for user ID: {}", onBoardDoctorRequestDto.getUserId());
        
        User user = userRepository.findById(onBoardDoctorRequestDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(doctorRepository.existsById(onBoardDoctorRequestDto.getUserId())) {
            throw new IllegalArgumentException("User is already registered as a doctor");
        }

        Doctor doctor = Doctor.builder()
                .name(onBoardDoctorRequestDto.getName())
                .specialization(onBoardDoctorRequestDto.getSpecialization())
                .user(user)
                .build();

        // Add DOCTOR role to the user
        user.getRoles().add(RoleType.DOCTOR);

        Doctor savedDoctor = doctorRepository.save(doctor);
        log.info("Successfully onboarded doctor: {}", savedDoctor.getName());
        
        return modelMapper.map(savedDoctor, DoctorResponseDto.class);
    }
}