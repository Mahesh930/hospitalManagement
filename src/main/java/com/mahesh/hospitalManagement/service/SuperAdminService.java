package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final FeatureFlagRepository featureFlagRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final ChargeMasterRepository chargeMasterRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    // ─────────────────────────────────────────────────────────────
    // HOSPITAL ONBOARDING
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public SuperAdminHospitalDto onboardHospital(SuperAdminHospitalDto dto, String currentAdmin) {
        log.info("Super Admin onboarding hospital: {}", dto.getName());

        HospitalDetails details = HospitalDetails.builder()
                .gstNumber(dto.getGstNumber())
                .licenseNumber(dto.getLicenseNumber())
                .category(dto.getCategory() != null ? dto.getCategory() : "PRIVATE")
                .ownershipType(dto.getOwnershipType() != null ? dto.getOwnershipType() : "CORPORATE")
                .city(dto.getCity())
                .state(dto.getState())
                .country(dto.getCountry() != null ? dto.getCountry() : "India")
                .postalCode(dto.getPostalCode())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .emergencyNumber(dto.getEmergencyNumber())
                .website(dto.getWebsite())
                .build();

        Hospital hospital = Hospital.builder()
                .name(dto.getName())
                .address(dto.getAddress() != null ? dto.getAddress() : dto.getCity())
                .registrationNumber(dto.getRegistrationNumber())
                .status("ACTIVE")
                .isSuspended(false)
                .maxUsers(dto.getMaxUsers() != null ? dto.getMaxUsers() : 25)
                .maxDoctors(dto.getMaxDoctors() != null ? dto.getMaxDoctors() : 10)
                .maxBeds(dto.getMaxBeds() != null ? dto.getMaxBeds() : 50)
                .details(details)
                .build();

        hospital = hospitalRepository.save(hospital);
        final UUID hospitalId = hospital.getId();

        // 1. Provision Default Departments
        List<String> defaultDepts = List.of(
                "General Medicine", "Cardiology", "Pediatrics", "Orthopedics", "Emergency"
        );
        for (String deptName : defaultDepts) {
            Department dept = Department.builder()
                    .name(deptName)
                    .hospital(hospital)
                    .build();
            departmentRepository.save(dept);
        }

        // 2. Provision Default Modules / Feature Flags
        List<String> modules = List.of("PHARMACY", "RADIOLOGY", "ICU", "HR_PAYROLL", "ABDM", "LAB", "TELEMEDICINE");
        for (String module : modules) {
            FeatureFlag flag = FeatureFlag.builder()
                    .hospitalId(hospitalId)
                    .moduleCode(module)
                    .enabled(true)
                    .build();
            featureFlagRepository.save(flag);
        }

        // 3. Provision Default Consultation Charge Masters
        List<Object[]> defaultCharges = List.of(
                new Object[]{"OPD-CONSULT-001", "OPD Consultation", "CONSULTATION", 500.0, 0.0},
                new Object[]{"EMRG-CONSULT-001", "Emergency Consultation", "CONSULTATION", 1500.0, 0.0},
                new Object[]{"FOLLOWUP-001", "Follow-up Consultation", "CONSULTATION", 300.0, 0.0}
        );
        for (Object[] charge : defaultCharges) {
            chargeMasterRepository.save(ChargeMaster.builder()
                    .itemCode((String) charge[0])
                    .itemName((String) charge[1])
                    .category((String) charge[2])
                    .standardPrice((Double) charge[3])
                    .gstPercentage((Double) charge[4])
                    .build());
        }

        // 4. Provision Default Hospital Admin User
        String adminUsername = "admin@" + hospital.getRegistrationNumber()
                .toLowerCase().replaceAll("[^a-z0-9]", "");
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            User adminUser = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode("Admin@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .hospital(hospital)
                    .roles(Set.of(RoleType.ADMIN))
                    .build();
            userRepository.save(adminUser);
        }

        auditService.logAction(currentAdmin, "ONBOARD_HOSPITAL", null, hospital.getName(), "0.0.0.0", "Web", hospital.getName());

        return mapToDto(hospital);
    }

    // ─────────────────────────────────────────────────────────────
    // HOSPITAL LISTING — SEARCH, FILTER, PAGINATE
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SuperAdminHospitalDto> getAllHospitals() {
        return hospitalRepository.findAllActive().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<SuperAdminHospitalDto> searchHospitals(String search, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return hospitalRepository.searchActiveHospitals(search == null ? "" : search, pageable)
                .map(this::mapToDto);
    }

    // ─────────────────────────────────────────────────────────────
    // HOSPITAL STATUS OPERATIONS
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public SuperAdminHospitalDto toggleHospitalStatus(UUID hospitalId, boolean suspend, String currentAdmin) {
        Hospital hospital = getActiveHospital(hospitalId);
        hospital.setIsSuspended(suspend);
        hospital.setStatus(suspend ? "SUSPENDED" : "ACTIVE");
        hospital = hospitalRepository.save(hospital);
        auditService.logAction(currentAdmin,
                suspend ? "SUSPEND_HOSPITAL" : "REACTIVATE_HOSPITAL",
                null, hospital.getName(), "0.0.0.0", "Web", hospital.getName());
        return mapToDto(hospital);
    }

    @Transactional
    public SuperAdminHospitalDto archiveHospital(UUID hospitalId, String currentAdmin) {
        Hospital hospital = getActiveHospital(hospitalId);
        hospital.setStatus("ARCHIVED");
        hospital = hospitalRepository.save(hospital);
        auditService.logAction(currentAdmin, "ARCHIVE_HOSPITAL", null, hospital.getName(), "0.0.0.0", "Web", hospital.getName());
        return mapToDto(hospital);
    }

    @Transactional
    public SuperAdminHospitalDto softDeleteHospital(UUID hospitalId, String currentAdmin) {
        Hospital hospital = getActiveHospital(hospitalId);
        hospital.setDeletedAt(LocalDateTime.now());
        hospital.setStatus("DELETED");
        hospital = hospitalRepository.save(hospital);
        auditService.logAction(currentAdmin, "DELETE_HOSPITAL", null, hospital.getName(), "0.0.0.0", "Web", hospital.getName());
        return mapToDto(hospital);
    }

    @Transactional
    public SuperAdminHospitalDto restoreHospital(UUID hospitalId, String currentAdmin) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));
        hospital.setDeletedAt(null);
        hospital.setStatus("ACTIVE");
        hospital.setIsSuspended(false);
        hospital = hospitalRepository.save(hospital);
        auditService.logAction(currentAdmin, "RESTORE_HOSPITAL", null, hospital.getName(), "0.0.0.0", "Web", hospital.getName());
        return mapToDto(hospital);
    }

    // ─────────────────────────────────────────────────────────────
    // PLATFORM STATS
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PlatformStatsDto getPlatformStats() {
        return PlatformStatsDto.builder()
                .totalHospitals(hospitalRepository.countActive())
                .activeHospitals(hospitalRepository.countByStatus("ACTIVE"))
                .suspendedHospitals(hospitalRepository.countSuspended())
                .trialHospitals(hospitalRepository.countByStatus("TRIAL"))
                .totalUsers(userRepository.count())
                .totalDoctors(doctorRepository.count())
                .totalPatients(patientRepository.count())
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // FEATURE FLAGS
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FeatureFlagDto> getHospitalFeatureFlags(UUID hospitalId) {
        return featureFlagRepository.findByHospitalId(hospitalId).stream()
                .map(flag -> FeatureFlagDto.builder()
                        .id(flag.getId())
                        .hospitalId(flag.getHospitalId())
                        .moduleCode(flag.getModuleCode())
                        .enabled(flag.getEnabled())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public FeatureFlagDto toggleFeatureFlag(UUID hospitalId, String moduleCode, boolean enabled, String currentAdmin) {
        FeatureFlag flag = featureFlagRepository.findByHospitalIdAndModuleCode(hospitalId, moduleCode)
                .orElseGet(() -> FeatureFlag.builder()
                        .hospitalId(hospitalId)
                        .moduleCode(moduleCode)
                        .enabled(enabled)
                        .build());
        flag.setEnabled(enabled);
        flag = featureFlagRepository.save(flag);
        auditService.logAction(currentAdmin, "TOGGLE_FEATURE_FLAG", moduleCode, String.valueOf(enabled), "0.0.0.0", "Web", "System");
        return FeatureFlagDto.builder()
                .id(flag.getId()).hospitalId(flag.getHospitalId())
                .moduleCode(flag.getModuleCode()).enabled(flag.getEnabled()).build();
    }

    // ─────────────────────────────────────────────────────────────
    // CROSS-TENANT USER MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SuperAdminUserDto> searchUsers(String search, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return userRepository.searchUsers(search == null ? "" : search, pageable)
                .map(this::mapUserToDto);
    }

    @Transactional
    public SuperAdminUserDto lockUser(UUID userId, String currentAdmin) {
        User user = getActiveUser(userId);
        // Lock indefinitely — set lockedUntil to far future
        user.setLockedUntil(LocalDateTime.now().plusYears(100));
        user = userRepository.save(user);
        auditService.logAction(currentAdmin, "LOCK_USER", null, user.getUsername(), "0.0.0.0", "Web", "System");
        return mapUserToDto(user);
    }

    @Transactional
    public SuperAdminUserDto unlockUser(UUID userId, String currentAdmin) {
        User user = getActiveUser(userId);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        user = userRepository.save(user);
        auditService.logAction(currentAdmin, "UNLOCK_USER", null, user.getUsername(), "0.0.0.0", "Web", "System");
        return mapUserToDto(user);
    }

    @Transactional
    public SuperAdminUserDto resetUserPassword(UUID userId, String newPassword, String currentAdmin) {
        User user = getActiveUser(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        user = userRepository.save(user);
        auditService.logAction(currentAdmin, "RESET_PASSWORD", null, user.getUsername(), "0.0.0.0", "Web", "System");
        return mapUserToDto(user);
    }

    @Transactional
    public SuperAdminUserDto softDeleteUser(UUID userId, String currentAdmin) {
        User user = getActiveUser(userId);
        user.setDeletedAt(LocalDateTime.now());
        user = userRepository.save(user);
        auditService.logAction(currentAdmin, "DELETE_USER", null, user.getUsername(), "0.0.0.0", "Web", "System");
        return mapUserToDto(user);
    }

    @Transactional
    public SuperAdminUserDto restoreUser(UUID userId, String currentAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setDeletedAt(null);
        user = userRepository.save(user);
        auditService.logAction(currentAdmin, "RESTORE_USER", null, user.getUsername(), "0.0.0.0", "Web", "System");
        return mapUserToDto(user);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private Hospital getActiveHospital(UUID id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id));
    }

    private User getActiveUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private SuperAdminHospitalDto mapToDto(Hospital hospital) {
        HospitalDetails d = hospital.getDetails();
        return SuperAdminHospitalDto.builder()
                .id(hospital.getId())
                .name(hospital.getName())
                .address(hospital.getAddress())
                .registrationNumber(hospital.getRegistrationNumber())
                .status(hospital.getStatus())
                .isSuspended(hospital.getIsSuspended())
                .maxUsers(hospital.getMaxUsers())
                .maxDoctors(hospital.getMaxDoctors())
                .maxBeds(hospital.getMaxBeds())
                .gstNumber(d != null ? d.getGstNumber() : null)
                .licenseNumber(d != null ? d.getLicenseNumber() : null)
                .category(d != null ? d.getCategory() : null)
                .ownershipType(d != null ? d.getOwnershipType() : null)
                .city(d != null ? d.getCity() : null)
                .state(d != null ? d.getState() : null)
                .country(d != null ? d.getCountry() : null)
                .postalCode(d != null ? d.getPostalCode() : null)
                .email(d != null ? d.getEmail() : null)
                .phone(d != null ? d.getPhone() : null)
                .emergencyNumber(d != null ? d.getEmergencyNumber() : null)
                .website(d != null ? d.getWebsite() : null)
                .build();
    }

    private SuperAdminUserDto mapUserToDto(User user) {
        String rolesStr = user.getRoles() == null ? "" :
                user.getRoles().stream().map(Enum::name).collect(Collectors.joining(", "));
        boolean locked = user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now());
        return SuperAdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .phone(user.getPhone())
                .roles(rolesStr)
                .providerType(user.getProviderType() != null ? user.getProviderType().name() : null)
                .locked(locked)
                .hospitalId(user.getHospital() != null ? user.getHospital().getId() : null)
                .hospitalName(user.getHospital() != null ? user.getHospital().getName() : "Platform")
                .build();
    }
}
