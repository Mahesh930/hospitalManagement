package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.HospitalAdminStatsDto;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import com.mahesh.hospitalManagement.dto.CreateUserRequestDto;
import com.mahesh.hospitalManagement.dto.SuperAdminUserDto;
import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.Ward;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final DoctorService doctorService;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Aggregates live operational statistics for the Hospital Admin dashboard.
     */
    public HospitalAdminStatsDto getHospitalAdminStats() {
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long todayOpdPatients = appointmentRepository.count();
        
        // Calculate total revenue from paid invoices
        double totalRevenue = invoiceRepository.findAll().stream()
                .filter(inv -> "PAID".equalsIgnoreCase(inv.getPaymentStatus()))
                .mapToDouble(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : 0.0)
                .sum();

        long pendingBills = invoiceRepository.findAll().stream()
                .filter(inv -> "PENDING".equalsIgnoreCase(inv.getPaymentStatus()) || "UNPAID".equalsIgnoreCase(inv.getPaymentStatus()))
                .count();

        long checkedInPatients = appointmentRepository.findAll().stream()
                .filter(app -> "CHECKED_IN".equalsIgnoreCase(app.getStatus()))
                .count();

        return HospitalAdminStatsDto.builder()
                .todayOpdPatients(todayOpdPatients)
                .checkedInPatients(checkedInPatients)
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalRevenueToday(totalRevenue)
                .pendingBillsCount(pendingBills)
                .occupiedBeds(12) // Mocked initial bed occupancy metrics
                .totalBeds(50)
                .build();
    }

    /**
     * Retrieves all onboarded doctors in the hospital.
     */
    public List<DoctorResponseDto> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    /**
     * Provisions a new staff member account for the Hospital Admin's tenant workspace.
     */
    @Transactional
    public SuperAdminUserDto createStaffUser(CreateUserRequestDto dto, String currentAdminUsername) {
        if (dto == null || dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new BusinessValidationException("Username is required.");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new BusinessValidationException("Password is required.");
        }

        User currentUser = userRepository.findByUsername(currentAdminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found: " + currentAdminUsername));

        String cleanUsername = dto.getUsername().trim();
        if (userRepository.findByUsername(cleanUsername).isPresent()) {
            throw new BusinessValidationException("Username '" + cleanUsername + "' is already taken.");
        }

        RoleType role = RoleType.RECEPTIONIST;
        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            try {
                role = RoleType.valueOf(dto.getRole().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                role = RoleType.RECEPTIONIST;
            }
        }

        Ward assignedWard = null;
        if (dto.getAssignedWardId() != null) {
            assignedWard = wardRepository.findById(dto.getAssignedWardId()).orElse(null);
        }

        User staffUser = User.builder()
                .username(cleanUsername)
                .password(passwordEncoder.encode(dto.getPassword().trim()))
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .providerType(AuthProviderType.EMAIL)
                .hospital(currentUser.getHospital())
                .roles(Set.of(role))
                .assignedWard(assignedWard)
                .build();

        staffUser = userRepository.save(staffUser);

        if (role == RoleType.DOCTOR) {
            if (doctorRepository.findByUserId(staffUser.getId()).isEmpty()) {
                String cleanUser = cleanUsername;
                String docName = cleanUser.contains("@") ? cleanUser.substring(0, cleanUser.indexOf("@")) : cleanUser;
                docName = docName.length() > 1 ? docName.substring(0, 1).toUpperCase() + docName.substring(1) : docName.toUpperCase();
                Doctor doctor = Doctor.builder()
                        .name("Dr. " + docName)
                        .specialization("General Practitioner")
                        .registrationNumber("DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .consultationFee(500.0)
                        .email(cleanUser)
                        .hospital(currentUser.getHospital())
                        .user(staffUser)
                        .build();
                doctorRepository.save(doctor);
            }
        }

        auditService.logAction(currentAdminUsername, "CREATE_STAFF_USER", role.name(), staffUser.getUsername(), "0.0.0.0", "Web", currentUser.getHospital() != null ? currentUser.getHospital().getName() : "Hospital");

        return mapUserToDto(staffUser);
    }

    /**
     * Retrieves all active staff members belonging to the Hospital Admin's workspace.
     */
    @Transactional(readOnly = true)
    public List<SuperAdminUserDto> getStaffUsers(String currentAdminUsername) {
        User currentUser = userRepository.findByUsername(currentAdminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found: " + currentAdminUsername));

        List<User> users;
        if (currentUser.getHospital() != null) {
            users = userRepository.findAll().stream()
                    .filter(u -> u.getDeletedAt() == null && u.getHospital() != null && u.getHospital().getId().equals(currentUser.getHospital().getId()))
                    .collect(Collectors.toList());
        } else {
            users = userRepository.findAll().stream()
                    .filter(u -> u.getDeletedAt() == null)
                    .collect(Collectors.toList());
        }

        return users.stream().map(this::mapUserToDto).collect(Collectors.toList());
    }

    private SuperAdminUserDto mapUserToDto(User user) {
        String rolesStr = user.getRoles() == null ? "" :
                user.getRoles().stream().map(Enum::name).collect(Collectors.joining(", "));
        boolean locked = user.getLockedUntil() != null && user.getLockedUntil().isAfter(java.time.LocalDateTime.now());
        return SuperAdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .phone(user.getPhone())
                .roles(rolesStr)
                .providerType(user.getProviderType() != null ? user.getProviderType().name() : null)
                .locked(locked)
                .hospitalId(user.getHospital() != null ? user.getHospital().getId() : null)
                .hospitalName(user.getHospital() != null ? user.getHospital().getName() : "Platform")
                .assignedWardId(user.getAssignedWard() != null ? user.getAssignedWard().getId() : null)
                .assignedWardName(user.getAssignedWard() != null ? user.getAssignedWard().getName() : null)
                .build();
    }
}
