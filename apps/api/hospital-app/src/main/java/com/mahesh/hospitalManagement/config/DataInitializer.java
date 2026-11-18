package com.mahesh.hospitalManagement.config;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final com.mahesh.hospitalManagement.repository.DoctorRepository doctorRepository;
    private final com.mahesh.hospitalManagement.repository.PatientAllergyRepository patientAllergyRepository;
    private final com.mahesh.hospitalManagement.repository.AppointmentRepository appointmentRepository;
    private final com.mahesh.hospitalManagement.repository.PatientVisitRepository patientVisitRepository;
    private final com.mahesh.hospitalManagement.repository.DiagnosisCatalogueRepository diagnosisCatalogueRepository;
    private final com.mahesh.hospitalManagement.repository.MedicineCatalogueRepository medicineCatalogueRepository;
    private final com.mahesh.hospitalManagement.repository.MedicineBatchRepository medicineBatchRepository;
    private final com.mahesh.hospitalManagement.repository.DiagnosticBookingRepository diagnosticBookingRepository;
    private final com.mahesh.hospitalManagement.repository.InvoiceRepository invoiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Drop legacy enum CHECK so expanded RoleType values can persist
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS user_roles DROP CONSTRAINT IF EXISTS user_roles_roles_check");
        } catch (Exception ex) {
            log.warn("Could not drop user_roles_roles_check: {}", ex.getMessage());
        }

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

        // Seed / refresh default hospital admin account (demo credentials stay predictable)
        Optional<User> existingAdmin = userRepository.findByUsername("admin");
        if (existingAdmin.isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.ADMIN))
                    .build();
            userRepository.save(admin);
            log.info("Initialized default ADMIN user: username='admin', password='admin123'");
        } else {
            User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            if (admin.getRoles() == null || admin.getRoles().isEmpty()) {
                admin.setRoles(Set.of(RoleType.ADMIN));
            }
            userRepository.save(admin);
            log.info("Refreshed default ADMIN credentials: username='admin'");
        }

        // Seed / refresh Receptionist
        Optional<User> existingReceptionist = userRepository.findByUsername("receptionist");
        if (existingReceptionist.isEmpty()) {
            User receptionist = User.builder()
                    .username("receptionist")
                    .password(passwordEncoder.encode("receptionist123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.RECEPTIONIST))
                    .build();
            userRepository.save(receptionist);
            log.info("Initialized default RECEPTIONIST user: username='receptionist', password='receptionist123'");
        } else {
            User receptionist = existingReceptionist.get();
            receptionist.setPassword(passwordEncoder.encode("receptionist123"));
            userRepository.save(receptionist);
        }

        // Seed / refresh Pharmacist
        Optional<User> existingPharmacist = userRepository.findByUsername("pharmacist");
        if (existingPharmacist.isEmpty()) {
            User pharmacist = User.builder()
                    .username("pharmacist")
                    .password(passwordEncoder.encode("pharmacist123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.PHARMACIST))
                    .build();
            userRepository.save(pharmacist);
            log.info("Initialized default PHARMACIST user: username='pharmacist', password='pharmacist123'");
        } else {
            User pharmacist = existingPharmacist.get();
            pharmacist.setPassword(passwordEncoder.encode("pharmacist123"));
            userRepository.save(pharmacist);
        }

        // Seed default Cashier user account for billing and payment collection
        if (userRepository.findByUsername("cashier").isEmpty()) {
            User cashier = User.builder()
                    .username("cashier")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.CASHIER))
                    .build();
            userRepository.save(cashier);
            log.info("Initialized default CASHIER user: username='cashier', password='Password@123'");
        }

        // Seed default Lab Technician user account for laboratory workstation
        if (userRepository.findByUsername("labtech").isEmpty()) {
            User labtech = User.builder()
                    .username("labtech")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.LAB_TECH))
                    .build();
            userRepository.save(labtech);
            log.info("Initialized default LAB_TECH user: username='labtech', password='Password@123'");
        }

        // Seed extended HIS station roles (multi-specialty hospital)
        seedStaffUser("labmanager", RoleType.LAB_MANAGER);
        seedStaffUser("radiologist", RoleType.RADIOLOGIST);
        seedStaffUser("radiologytech", RoleType.RADIOLOGY_TECH);
        seedStaffUser("accountant", RoleType.ACCOUNTANT);
        seedStaffUser("tpainsurance", RoleType.TPA_INSURANCE);
        seedStaffUser("mrd", RoleType.MRD);
        seedStaffUser("hradmin", RoleType.HR_ADMIN);
        seedStaffUser("otcoordinator", RoleType.OT_COORDINATOR);
        seedStaffUser("anesthetist", RoleType.ANESTHETIST);
        seedStaffUser("physiotherapist", RoleType.PHYSIOTHERAPIST);
        seedStaffUser("bloodbank", RoleType.BLOOD_BANK);
        seedStaffUser("qualityofficer", RoleType.QUALITY_OFFICER);

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
            log.info("Seeded active admission in ICU for patient: {}", icuPatient.getName());
        }

        // 4. Seed default DOCTOR user and Doctor profile
        List<String> doctorUsernames = List.of("doctor", "doctor@medicore.com");
        User primaryDoctorUser = null;
        for (String docUsername : doctorUsernames) {
            Optional<User> existingDoc = userRepository.findByUsername(docUsername);
            User docUser;
            if (existingDoc.isEmpty()) {
                docUser = User.builder()
                        .username(docUsername)
                        .password(passwordEncoder.encode("Password@123"))
                        .providerType(AuthProviderType.EMAIL)
                        .roles(Set.of(RoleType.DOCTOR))
                        .hospital(defaultHospital)
                        .build();
                docUser = userRepository.save(docUser);
                log.info("Initialized default DOCTOR user: username='{}', password='Password@123'", docUsername);
            } else {
                docUser = existingDoc.get();
                docUser.setPassword(passwordEncoder.encode("Password@123"));
                if (docUser.getRoles() == null || !docUser.getRoles().contains(RoleType.DOCTOR)) {
                    docUser.setRoles(Set.of(RoleType.DOCTOR));
                }
                docUser = userRepository.save(docUser);
            }
            if (primaryDoctorUser == null) {
                primaryDoctorUser = docUser;
            }
        }

        final User doctorUserRef = primaryDoctorUser;
        com.mahesh.hospitalManagement.entity.Doctor seededDoctor = doctorRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.mahesh.hospitalManagement.entity.Doctor d = com.mahesh.hospitalManagement.entity.Doctor.builder()
                    .user(doctorUserRef)
                    .name("Dr. Sarah Jenkins")
                    .email("doctor@medicore.com")
                    .specialization("Cardiology & Internal Medicine")
                    .registrationNumber("MED-REG-48920")
                    .consultationFee(600.0)
                    .roomNumber("OPD-102")
                    .isAvailable(true)
                    .phone("9876543210")
                    .qualification("MBBS, MD (Medicine)")
                    .experienceYears(12)
                    .scheduleSummary("Mon-Fri: 09:00 AM - 05:00 PM, Sat: 09:00 AM - 01:00 PM")
                    .hospital(defaultHospital)
                    .build();
            return doctorRepository.save(d);
        });

        // 5. Seed patient allergy for Ramesh Kumar (to test drug allergy hard blocker)
        if (patientAllergyRepository.findByPatientId(admittedPatient.getId()).isEmpty()) {
            com.mahesh.hospitalManagement.entity.PatientAllergy allergy = com.mahesh.hospitalManagement.entity.PatientAllergy.builder()
                    .patient(admittedPatient)
                    .allergen("Amoxicillin")
                    .severity("SEVERE")
                    .reaction("Anaphylaxis, Angioedema and skin hives")
                    .build();
            patientAllergyRepository.save(allergy);
            log.info("Seeded critical allergy 'Amoxicillin' for patient: {}", admittedPatient.getName());
        }

        // 6. Seed today's appointment and active queue visit for Dr. Sarah Jenkins with Ramesh Kumar
        java.time.LocalDateTime todaySlot = java.time.LocalDateTime.now().withHour(10).withMinute(30).withSecond(0).withNano(0);
        if (appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                seededDoctor.getId(), java.time.LocalDate.now().atStartOfDay(), java.time.LocalDate.now().atTime(java.time.LocalTime.MAX)).isEmpty()) {
            com.mahesh.hospitalManagement.entity.Appointment appt = com.mahesh.hospitalManagement.entity.Appointment.builder()
                    .doctor(seededDoctor)
                    .patient(admittedPatient)
                    .appointmentTime(todaySlot)
                    .status("CHECKED_IN")
                    .reason("Chest tightness and exertion dyspnea")
                    .queueOrder(1)
                    .build();
            com.mahesh.hospitalManagement.entity.Appointment savedAppt = appointmentRepository.save(appt);

            com.mahesh.hospitalManagement.entity.PatientVisit visit = com.mahesh.hospitalManagement.entity.PatientVisit.builder()
                    .patient(admittedPatient)
                    .doctor(seededDoctor)
                    .appointment(savedAppt)
                    .visitType("OPD")
                    .tokenNumber("T-101")
                    .status("WAITING_DOCTOR")
                    .priorityRank(1)
                    .checkInTime(java.time.LocalDateTime.now().minusMinutes(20))
                    .notes("Chest tightness and exertion dyspnea")
                    .build();
            patientVisitRepository.save(visit);
            log.info("Seeded today's appointment and active queue visit for Dr. Sarah Jenkins with patient: {}", admittedPatient.getName());
        }

        // 7. Seed ICD-10 Diagnosis Catalogue
        if (diagnosisCatalogueRepository.findAll().isEmpty()) {
            diagnosisCatalogueRepository.save(com.mahesh.hospitalManagement.entity.DiagnosisCatalogue.builder()
                    .icdCode("I10")
                    .description("Essential (primary) hypertension")
                    .category("Cardiovascular")
                    .build());
            diagnosisCatalogueRepository.save(com.mahesh.hospitalManagement.entity.DiagnosisCatalogue.builder()
                    .icdCode("J45.909")
                    .description("Unspecified asthma, uncomplicated")
                    .category("Respiratory")
                    .build());
            diagnosisCatalogueRepository.save(com.mahesh.hospitalManagement.entity.DiagnosisCatalogue.builder()
                    .icdCode("E11.9")
                    .description("Type 2 diabetes mellitus without complications")
                    .category("Endocrine")
                    .build());
            diagnosisCatalogueRepository.save(com.mahesh.hospitalManagement.entity.DiagnosisCatalogue.builder()
                    .icdCode("J06.9")
                    .description("Acute upper respiratory infection, unspecified")
                    .category("Infectious")
                    .build());
            log.info("Seeded default ICD-10 diagnosis catalogue");
        }

        // 8. Seed Medicine Catalogue
        if (medicineCatalogueRepository.findAll().isEmpty()) {
            medicineCatalogueRepository.save(com.mahesh.hospitalManagement.entity.MedicineCatalogue.builder()
                    .name("Amoxicillin 500mg")
                    .genericName("Amoxicillin")
                    .dosageForm("Capsule")
                    .strength("500mg")
                    .manufacturer("PharmaCorp")
                    .unitPrice(15.0)
                    .build());
            medicineCatalogueRepository.save(com.mahesh.hospitalManagement.entity.MedicineCatalogue.builder()
                    .name("Paracetamol 650mg")
                    .genericName("Acetaminophen")
                    .dosageForm("Tablet")
                    .strength("650mg")
                    .manufacturer("MediLife")
                    .unitPrice(5.0)
                    .build());
            medicineCatalogueRepository.save(com.mahesh.hospitalManagement.entity.MedicineCatalogue.builder()
                    .name("Metformin 500mg")
                    .genericName("Metformin HCl")
                    .dosageForm("Tablet")
                    .strength("500mg")
                    .manufacturer("HealthCare")
                    .unitPrice(8.0)
                    .build());
            medicineCatalogueRepository.save(com.mahesh.hospitalManagement.entity.MedicineCatalogue.builder()
                    .name("Aspirin 75mg")
                    .genericName("Acetylsalicylic acid")
                    .dosageForm("Tablet")
                    .strength("75mg")
                    .manufacturer("CardioPharm")
                    .unitPrice(6.0)
                    .build());
            medicineCatalogueRepository.save(com.mahesh.hospitalManagement.entity.MedicineCatalogue.builder()
                    .name("Warfarin 5mg")
                    .genericName("Warfarin Sodium")
                    .dosageForm("Tablet")
                    .strength("5mg")
                    .manufacturer("CardioPharm")
                    .unitPrice(12.0)
                    .build());
            log.info("Seeded default hospital medicine catalogue");
        }

        // 9. Seed Pharmacy Medicine Batches (FEFO Inventory)
        if (medicineBatchRepository.findAll().isEmpty()) {
            var medicines = medicineCatalogueRepository.findAll();
            for (var med : medicines) {
                // Batch 1: Primary active stock (healthy expiry)
                medicineBatchRepository.save(com.mahesh.hospitalManagement.entity.MedicineBatch.builder()
                        .medicine(med)
                        .batchNumber("B-" + med.getName().substring(0, 3).toUpperCase() + "-2026")
                        .expiryDate(java.time.LocalDate.now().plusMonths(14))
                        .mfgDate(java.time.LocalDate.now().minusMonths(2))
                        .purchasePrice((med.getUnitPrice() != null ? med.getUnitPrice() : 10.0) * 0.7)
                        .mrp(med.getUnitPrice() != null ? med.getUnitPrice() * 1.2 : 15.0)
                        .sellingPrice(med.getUnitPrice() != null ? med.getUnitPrice() : 10.0)
                        .quantityOnHand(150)
                        .quarantinedQuantity(0)
                        .storageLocation("Rack A-" + (med.getName().length() % 5 + 1) + ", Shelf 2")
                        .supplierName("Apex Healthcare Distributors")
                        .status("ACTIVE")
                        .build());

                // Batch 2: Near expiry batch for first medicine to demonstrate alerts
                if (med.getName().toLowerCase().contains("amoxicillin")) {
                    medicineBatchRepository.save(com.mahesh.hospitalManagement.entity.MedicineBatch.builder()
                            .medicine(med)
                            .batchNumber("EXP-AMX-2025")
                            .expiryDate(java.time.LocalDate.now().plusDays(20))
                            .mfgDate(java.time.LocalDate.now().minusMonths(18))
                            .purchasePrice(8.0)
                            .mrp(18.0)
                            .sellingPrice(15.0)
                            .quantityOnHand(12)
                            .quarantinedQuantity(0)
                            .storageLocation("Front Counter Fast-Rack 1")
                            .supplierName("Apex Healthcare Distributors")
                            .status("NEAR_EXPIRY")
                            .notes("Near expiry alert (expires in 20 days)")
                            .build());
                }
            }
            log.info("Seeded initial pharmacy medicine batches with FEFO inventory");
        }

        // 10. Seed Initial Diagnostic Bookings for Laboratory & Doctor
        if (diagnosticBookingRepository.findAll().isEmpty()) {
            diagnosticBookingRepository.save(com.mahesh.hospitalManagement.entity.DiagnosticBooking.builder()
                    .patientId(admittedPatient.getId())
                    .patientName(admittedPatient.getName())
                    .patientUhid(admittedPatient.getUhid())
                    .testName("Complete Blood Count (CBC) with Differential")
                    .category("LAB")
                    .bookingDateTime(java.time.LocalDateTime.now().minusHours(3))
                    .status("SCHEDULED")
                    .referringDoctorId(seededDoctor.getId())
                    .referringDoctorName(seededDoctor.getName())
                    .departmentName("Cardiology")
                    .instructions("Fasting sample preferred. Check EDTA tube integrity.")
                    .clinicalNotes("Routine baseline monitoring for admitted patient.")
                    .bookedBy("doctor@medicore.com")
                    .isAbnormal(false)
                    .build());

            diagnosticBookingRepository.save(com.mahesh.hospitalManagement.entity.DiagnosticBooking.builder()
                    .patientId(admittedPatient.getId())
                    .patientName(admittedPatient.getName())
                    .patientUhid(admittedPatient.getUhid())
                    .testName("Lipid Profile & Serum Cholesterol")
                    .category("LAB")
                    .bookingDateTime(java.time.LocalDateTime.now().minusHours(2))
                    .status("SAMPLE_COLLECTED")
                    .referringDoctorId(seededDoctor.getId())
                    .referringDoctorName(seededDoctor.getName())
                    .departmentName("Cardiology")
                    .instructions("12-hour fasting required.")
                    .clinicalNotes("Sample Barcode: BAR-CBC-9011 (Serum) - Collected by Lab Station")
                    .bookedBy("doctor@medicore.com")
                    .isAbnormal(false)
                    .build());

            diagnosticBookingRepository.save(com.mahesh.hospitalManagement.entity.DiagnosticBooking.builder()
                    .patientId(admittedPatient.getId())
                    .patientName(admittedPatient.getName())
                    .patientUhid(admittedPatient.getUhid())
                    .testName("Chest X-Ray PA View")
                    .category("RADIOLOGY")
                    .bookingDateTime(java.time.LocalDateTime.now().minusDays(1))
                    .status("COMPLETED")
                    .referringDoctorId(seededDoctor.getId())
                    .referringDoctorName(seededDoctor.getName())
                    .departmentName("Cardiology")
                    .instructions("Evaluate lung fields and cardiothoracic ratio.")
                    .clinicalNotes("Mild exertional dyspnea on admission.")
                    .resultNotes("Clear lung parenchyma. Normal cardiothoracic ratio. No focal consolidations or effusion noted.")
                    .resultRecordedAt(java.time.LocalDateTime.now().minusHours(6))
                    .isAbnormal(false)
                    .bookedBy("doctor@medicore.com")
                    .build());

            log.info("Seeded initial diagnostic bookings for laboratory workstation");
        }

        // 11. Seed Initial Invoices for Cashier Testing
        if (invoiceRepository.findAll().isEmpty()) {
            com.mahesh.hospitalManagement.entity.Invoice initialInvoice = com.mahesh.hospitalManagement.entity.Invoice.builder()
                    .invoiceNumber("INV-2026-0001")
                    .patient(admittedPatient)
                    .subtotal(1500.0)
                    .discountAmount(0.0)
                    .gstAmount(270.0)
                    .grandTotal(1770.0)
                    .paymentStatus("PENDING")
                    .build();

            com.mahesh.hospitalManagement.entity.InvoiceItem item1 = com.mahesh.hospitalManagement.entity.InvoiceItem.builder()
                    .invoice(initialInvoice)
                    .description("Specialist Consultation - " + seededDoctor.getName())
                    .quantity(1)
                    .unitPrice(600.0)
                    .gstPercentage(18.0)
                    .totalPrice(708.0)
                    .build();

            com.mahesh.hospitalManagement.entity.InvoiceItem item2 = com.mahesh.hospitalManagement.entity.InvoiceItem.builder()
                    .invoice(initialInvoice)
                    .description("Laboratory Investigation - Lipid Profile")
                    .quantity(1)
                    .unitPrice(900.0)
                    .gstPercentage(18.0)
                    .totalPrice(1062.0)
                    .build();

            initialInvoice.getItems().add(item1);
            initialInvoice.getItems().add(item2);
            invoiceRepository.save(initialInvoice);
            log.info("Seeded initial pending invoice for Cashier Desk: {}", initialInvoice.getInvoiceNumber());
        }
    }

    private void seedStaffUser(String username, RoleType role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(role))
                    .build();
            userRepository.save(user);
            log.info("Initialized {} user: username='{}', password='Password@123'", role.name(), username);
        } else {
            User existing = userRepository.findByUsername(username).orElseThrow();
            existing.setPassword(passwordEncoder.encode("Password@123"));
            if (existing.getRoles() == null || existing.getRoles().isEmpty()) {
                existing.setRoles(Set.of(role));
            } else if (!existing.getRoles().contains(role)) {
                existing.getRoles().add(role);
            }
            userRepository.save(existing);
        }
    }
}
