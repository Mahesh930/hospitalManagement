package com.mahesh.hospitalManagement.config;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Spring Boot CommandLineRunner responsible for seeding essential system accounts into the database upon application startup.
 * 
 * Logic Overview:
 * 1. Checks if default Super Admin ('superadmin@email.com') exists in UserRepository.
 * 2. If missing, creates and persists Super Admin user entity with BCrypt-encoded password ('Password@123') and SUPER_ADMIN + ADMIN roles.
 * 3. If account exists, updates password to guarantee credentials match 'Password@123'.
 * 4. Ensures fallback default 'admin' account ('admin123') is also initialized.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final com.mahesh.hospitalManagement.repository.PatientRepository patientRepository;
    private final com.mahesh.hospitalManagement.repository.HospitalRepository hospitalRepository;
    private final com.mahesh.hospitalManagement.repository.WardRepository wardRepository;
    private final com.mahesh.hospitalManagement.repository.BedRepository bedRepository;
    private final com.mahesh.hospitalManagement.repository.BedAdmissionRepository bedAdmissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed or update superadmin@email.com
        Optional<User> existingSuperAdminEmail = userRepository.findByUsername("superadmin@email.com");
        if (existingSuperAdminEmail.isEmpty()) {
            User superAdmin = User.builder()
                    .username("superadmin@email.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.SUPER_ADMIN, RoleType.ADMIN))
                    .build();
            userRepository.save(superAdmin);
            log.info("Initialized default SUPER_ADMIN user: username='superadmin@email.com', password='Password@123'");
        } else {
            User superAdmin = existingSuperAdminEmail.get();
            superAdmin.setPassword(passwordEncoder.encode("Password@123"));
            userRepository.save(superAdmin);
            log.info("Updated password for existing SUPER_ADMIN user: username='superadmin@email.com'");
        }

        // Seed legacy superadmin username fallback for compatibility
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            User legacySuperAdmin = User.builder()
                    .username("superadmin")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.SUPER_ADMIN, RoleType.ADMIN))
                    .build();
            userRepository.save(legacySuperAdmin);
            log.info("Initialized fallback SUPER_ADMIN user: username='superadmin', password='Password@123'");
        }

        // Seed default hospital admin account
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.ADMIN))
                    .build();
            userRepository.save(admin);
            log.info("Initialized default ADMIN user: username='admin', password='admin123'");
        }

        // Seed default Receptionist user account for patient registration and check-in workflows
        if (userRepository.findByUsername("receptionist").isEmpty()) {
            User receptionist = User.builder()
                    .username("receptionist")
                    .password(passwordEncoder.encode("receptionist123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.RECEPTIONIST))
                    .build();
            userRepository.save(receptionist);
            log.info("Initialized default RECEPTIONIST user: username='receptionist', password='receptionist123'");
        }

        // Auto-backfill & synchronize User accounts for all existing patients (Credentials: Email/Phone, Password: Password@123)
        var allPatients = patientRepository.findAllActivePatients();
        for (var p : allPatients) {
            String identifier = (p.getEmail() != null && !p.getEmail().isBlank()) ? p.getEmail() : p.getPhone();
            if (identifier == null || identifier.isBlank()) {
                identifier = p.getUhid();
            }
            final String userIdentifier = identifier;
            User user = userRepository.findByUsername(userIdentifier)
                    .orElseGet(() -> userRepository.findByIdentifier(userIdentifier)
                            .orElseGet(() -> {
                                User newUser = User.builder()
                                        .username(userIdentifier)
                                        .phone(p.getPhone())
                                        .password(passwordEncoder.encode("Password@123"))
                                        .providerType(AuthProviderType.EMAIL)
                                        .roles(Set.of(RoleType.PATIENT))
                                        .build();
                                return userRepository.save(newUser);
                            }));

            // Guarantee password is set to Password@123 and roles include PATIENT
            user.setPassword(passwordEncoder.encode("Password@123"));
            if (user.getPhone() == null && p.getPhone() != null) {
                user.setPhone(p.getPhone());
            }
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(Set.of(RoleType.PATIENT));
            }
            User savedUser = userRepository.save(user);

            if (p.getUser() == null || !p.getUser().getId().equals(savedUser.getId())) {
                p.setUser(savedUser);
                patientRepository.save(p);
            }
            log.info("Synchronized patient user account: username='{}', phone='{}', password='Password@123'", userIdentifier, p.getPhone());
        }

        // Seed default Hospital if missing
        com.mahesh.hospitalManagement.entity.Hospital defaultHospital = hospitalRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.mahesh.hospitalManagement.entity.Hospital h = com.mahesh.hospitalManagement.entity.Hospital.builder()
                    .name("MediCore Central Hospital")
                    .registrationNumber("HOSP-MCH-001")
                    .status("ACTIVE")
                    .address("100 Health Avenue, Medical City")
                    .build();
            return hospitalRepository.save(h);
        });

        // Seed General Ward
        com.mahesh.hospitalManagement.entity.Ward generalWard = wardRepository.findAll().stream()
                .filter(w -> "General Ward".equalsIgnoreCase(w.getName()))
                .findFirst()
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.Ward gw = com.mahesh.hospitalManagement.entity.Ward.builder()
                            .hospital(defaultHospital)
                            .name("General Ward")
                            .wardType("GENERAL")
                            .totalBeds(20)
                            .floorNumber("2nd Floor")
                            .description("General Inpatient Ward")
                            .build();
                    return wardRepository.save(gw);
                });

        // Seed ICU Ward
        com.mahesh.hospitalManagement.entity.Ward icuWard = wardRepository.findAll().stream()
                .filter(w -> "ICU".equalsIgnoreCase(w.getName()))
                .findFirst()
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.Ward icu = com.mahesh.hospitalManagement.entity.Ward.builder()
                            .hospital(defaultHospital)
                            .name("ICU")
                            .wardType("ICU")
                            .totalBeds(8)
                            .floorNumber("3rd Floor")
                            .description("Intensive Care Unit")
                            .build();
                    return wardRepository.save(icu);
                });

        // Seed Beds
        com.mahesh.hospitalManagement.entity.Bed bed101 = bedRepository.findByWardIdAndDeletedAtIsNull(generalWard.getId()).stream()
                .filter(b -> "BED-101".equalsIgnoreCase(b.getBedNumber()))
                .findFirst()
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.Bed b = com.mahesh.hospitalManagement.entity.Bed.builder()
                            .hospital(defaultHospital)
                            .ward(generalWard)
                            .bedNumber("BED-101")
                            .status("OCCUPIED")
                            .dailyRate(500.0)
                            .build();
                    return bedRepository.save(b);
                });

        com.mahesh.hospitalManagement.entity.Bed bed102 = bedRepository.findByWardIdAndDeletedAtIsNull(generalWard.getId()).stream()
                .filter(b -> "BED-102".equalsIgnoreCase(b.getBedNumber()))
                .findFirst()
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.Bed b = com.mahesh.hospitalManagement.entity.Bed.builder()
                            .hospital(defaultHospital)
                            .ward(generalWard)
                            .bedNumber("BED-102")
                            .status("AVAILABLE")
                            .dailyRate(500.0)
                            .build();
                    return bedRepository.save(b);
                });

        com.mahesh.hospitalManagement.entity.Bed bedIcu1 = bedRepository.findByWardIdAndDeletedAtIsNull(icuWard.getId()).stream()
                .filter(b -> "ICU-01".equalsIgnoreCase(b.getBedNumber()))
                .findFirst()
                .orElseGet(() -> {
                    com.mahesh.hospitalManagement.entity.Bed b = com.mahesh.hospitalManagement.entity.Bed.builder()
                            .hospital(defaultHospital)
                            .ward(icuWard)
                            .bedNumber("ICU-01")
                            .status("OCCUPIED")
                            .dailyRate(2500.0)
                            .build();
                    return bedRepository.save(b);
                });

        // Seed default Nurse user accounts assigned to General Ward
        List<String> nurseUsernames = List.of("nurse", "nurse@medicore.com");
        for (String nurseUser : nurseUsernames) {
            Optional<User> existingNurse = userRepository.findByUsername(nurseUser);
            if (existingNurse.isEmpty()) {
                User nurse = User.builder()
                        .username(nurseUser)
                        .password(passwordEncoder.encode("Password@123"))
                        .providerType(AuthProviderType.EMAIL)
                        .roles(Set.of(RoleType.NURSE))
                        .hospital(defaultHospital)
                        .assignedWard(generalWard)
                        .build();
                userRepository.save(nurse);
                log.info("Initialized default NURSE user: username='{}', password='Password@123', ward='General Ward'", nurseUser);
            } else {
                User nurse = existingNurse.get();
                nurse.setPassword(passwordEncoder.encode("Password@123"));
                nurse.setAssignedWard(generalWard);
                userRepository.save(nurse);
                log.info("Updated NURSE user with assigned General Ward: username='{}'", nurseUser);
            }
        }

        // Seed sample patients with active and discharged admissions
        // 1. Patient admitted in General Ward
        String admittedPhone = "9876500001";
        com.mahesh.hospitalManagement.entity.Patient admittedPatient = patientRepository.findByPhone(admittedPhone).orElseGet(() -> {
            com.mahesh.hospitalManagement.entity.Patient p = com.mahesh.hospitalManagement.entity.Patient.builder()
                    .name("Ramesh Kumar (Admitted Inpatient)")
                    .phone(admittedPhone)
                    .uhid("UHID-GW-001")
                    .birthDate(java.time.LocalDate.of(1985, 5, 12))
                    .gender("MALE")
                    .bloodGroup(com.mahesh.hospitalManagement.entity.type.BloodGroupType.O_POSITIVE)
                    .hospital(defaultHospital)
                    .build();
            return patientRepository.save(p);
        });

        if (bedAdmissionRepository.findActiveAdmissionByPatientAndWard(admittedPatient.getId(), generalWard.getId()).isEmpty()) {
            com.mahesh.hospitalManagement.entity.BedAdmission ba = com.mahesh.hospitalManagement.entity.BedAdmission.builder()
                    .patient(admittedPatient)
                    .bed(bed101)
                    .admissionTime(java.time.LocalDateTime.now().minusDays(2))
                    .status("ADMITTED")
                    .reasonForAdmission("Post-operative recovery")
                    .admittedByNurse("nurse@medicore.com")
                    .build();
            bedAdmissionRepository.save(ba);
            bed101.setStatus("OCCUPIED");
            bedRepository.save(bed101);
            log.info("Seeded active admission in General Ward for patient: {}", admittedPatient.getName());
        }

        // 2. Patient discharged from General Ward
        String dischargedPhone = "9876500002";
        com.mahesh.hospitalManagement.entity.Patient dischargedPatient = patientRepository.findByPhone(dischargedPhone).orElseGet(() -> {
            com.mahesh.hospitalManagement.entity.Patient p = com.mahesh.hospitalManagement.entity.Patient.builder()
                    .name("Suresh Patel (Discharged Patient)")
                    .phone(dischargedPhone)
                    .uhid("UHID-GW-002")
                    .birthDate(java.time.LocalDate.of(1992, 8, 20))
                    .gender("MALE")
                    .bloodGroup(com.mahesh.hospitalManagement.entity.type.BloodGroupType.A_POSITIVE)
                    .hospital(defaultHospital)
                    .build();
            return patientRepository.save(p);
        });

        if (bedAdmissionRepository.findByPatientIdAndDeletedAtIsNullOrderByAdmissionTimeDesc(dischargedPatient.getId()).isEmpty()) {
            com.mahesh.hospitalManagement.entity.BedAdmission ba = com.mahesh.hospitalManagement.entity.BedAdmission.builder()
                    .patient(dischargedPatient)
                    .bed(bed102)
                    .admissionTime(java.time.LocalDateTime.now().minusDays(5))
                    .dischargeTime(java.time.LocalDateTime.now().minusDays(1))
                    .status("DISCHARGED")
                    .reasonForAdmission("Observation")
                    .dischargeNotes("Fully recovered and stable")
                    .admittedByNurse("nurse@medicore.com")
                    .build();
            bedAdmissionRepository.save(ba);
            log.info("Seeded discharged admission for patient: {}", dischargedPatient.getName());
        }

        // 3. Patient admitted in ICU
        String icuPhone = "9876500003";
        com.mahesh.hospitalManagement.entity.Patient icuPatient = patientRepository.findByPhone(icuPhone).orElseGet(() -> {
            com.mahesh.hospitalManagement.entity.Patient p = com.mahesh.hospitalManagement.entity.Patient.builder()
                    .name("Vikram Singh (ICU Inpatient)")
                    .phone(icuPhone)
                    .uhid("UHID-ICU-001")
                    .birthDate(java.time.LocalDate.of(1975, 3, 15))
                    .gender("MALE")
                    .bloodGroup(com.mahesh.hospitalManagement.entity.type.BloodGroupType.B_POSITIVE)
                    .hospital(defaultHospital)
                    .build();
            return patientRepository.save(p);
        });

        if (bedAdmissionRepository.findActiveAdmissionByPatientAndWard(icuPatient.getId(), icuWard.getId()).isEmpty()) {
            com.mahesh.hospitalManagement.entity.BedAdmission ba = com.mahesh.hospitalManagement.entity.BedAdmission.builder()
                    .patient(icuPatient)
                    .bed(bedIcu1)
                    .admissionTime(java.time.LocalDateTime.now().minusHours(12))
                    .status("ADMITTED")
                    .reasonForAdmission("Cardiac monitoring")
                    .admittedByNurse("nurse@medicore.com")
                    .build();
            bedAdmissionRepository.save(ba);
            bedIcu1.setStatus("OCCUPIED");
            bedRepository.save(bedIcu1);
            log.info("Seeded active admission in ICU for patient: {}", icuPatient.getName());
        }
    }
}
